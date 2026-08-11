package br.com.stockflow.abastecimento;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.reserva.DestinoReserva;
import br.com.stockflow.reserva.Reserva;
import br.com.stockflow.reserva.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AbastecimentoService {

    private static final String GRUPO_PELUCIAS = "PELUCIAS";

    private static final Map<DestinoReserva, Set<String>> RESPONSAVEIS =
            Map.of(
                    DestinoReserva.BOULEVARD, Set.of("RODRIGO"),
                    DestinoReserva.AEROPORTO, Set.of("CESAR"),
                    DestinoReserva.MERCADOS, Set.of("RODRIGO", "CESAR"),
                    DestinoReserva.SUPERMAGO_BOA_VISTA,
                    Set.of("RODRIGO", "CESAR")
            );

    private static final Map<DestinoReserva, Map<String, Set<String>>>
            PRODUTOS_POR_MAQUINA = criarProdutosPorMaquina();

    private final EstoqueRepository estoqueRepository;
    private final EstoqueItemRepository estoqueItemRepository;
    private final ReservaRepository reservaRepository;
    private final AbastecimentoRepository abastecimentoRepository;

    public AbastecimentoService(
            EstoqueRepository estoqueRepository,
            EstoqueItemRepository estoqueItemRepository,
            ReservaRepository reservaRepository,
            AbastecimentoRepository abastecimentoRepository
    ) {
        this.estoqueRepository = estoqueRepository;
        this.estoqueItemRepository = estoqueItemRepository;
        this.reservaRepository = reservaRepository;
        this.abastecimentoRepository = abastecimentoRepository;
    }

    @Transactional
    public AbastecimentoResponse registrar(AbastecimentoRequest request) {
        validarResponsavel(request.responsavelId(), request.local());

        Estoque estoque = estoqueRepository
                .findByResponsavelId(request.responsavelId())
                .orElseThrow(() -> new RegraAbastecimentoException(
                        "Responsável inválido."
                ));

        Map<String, Integer> quantidadePorProduto = agregarEValidar(request);
        List<EstoqueItem> itensEstoque = estoqueItemRepository
                .buscarParaAtualizacao(
                        estoque.getId(),
                        quantidadePorProduto.keySet()
                );
        Map<String, EstoqueItem> estoquePorProduto = indexarEstoque(
                itensEstoque
        );
        List<Reserva> reservas = reservaRepository
                .buscarAtivasParaAbastecimento(
                        request.responsavelId(),
                        quantidadePorProduto.keySet()
                );

        Map<String, List<Reserva>> reservasPorProduto = indexarReservas(
                reservas
        );
        validarDisponibilidade(
                request.local(),
                quantidadePorProduto,
                estoquePorProduto,
                reservasPorProduto
        );

        Abastecimento abastecimento = new Abastecimento(
                estoque.getResponsavel(),
                estoque,
                request.local(),
                request.data(),
                request.observacao()
        );

        for (AbastecimentoRequest.Item solicitado : request.itens()) {
            EstoqueItem itemEstoque = estoquePorProduto.get(
                    solicitado.produtoId()
            );
            abastecimento.adicionarItem(new AbastecimentoItem(
                    abastecimento,
                    solicitado.maquinaId(),
                    itemEstoque.getProduto(),
                    solicitado.quantidade()
            ));
        }

        for (Map.Entry<String, Integer> entrada
                : quantidadePorProduto.entrySet()) {
            EstoqueItem itemEstoque = estoquePorProduto.get(entrada.getKey());
            int saldoAnterior = itemEstoque.getQuantidade();

            consumirReservas(
                    request.local(),
                    entrada.getValue(),
                    reservasPorProduto.getOrDefault(
                            entrada.getKey(),
                            List.of()
                    ),
                    request.data()
            );
            itemEstoque.remover(entrada.getValue());
            abastecimento.adicionarSaldo(new AbastecimentoSaldo(
                    abastecimento,
                    itemEstoque.getProduto(),
                    entrada.getValue(),
                    saldoAnterior,
                    itemEstoque.getQuantidade()
            ));
        }

        return AbastecimentoResponse.de(
                abastecimentoRepository.save(abastecimento)
        );
    }

    private Map<String, Integer> agregarEValidar(
            AbastecimentoRequest request
    ) {
        Map<String, Integer> quantidades = new LinkedHashMap<>();
        for (AbastecimentoRequest.Item item : request.itens()) {
            validarMaquinaEProduto(
                    request.local(),
                    item.maquinaId(),
                    item.produtoId()
            );
            quantidades.merge(
                    item.produtoId(),
                    item.quantidade(),
                    Math::addExact
            );
        }
        return quantidades;
    }

    private void validarDisponibilidade(
            DestinoReserva local,
            Map<String, Integer> quantidades,
            Map<String, EstoqueItem> estoquePorProduto,
            Map<String, List<Reserva>> reservasPorProduto
    ) {
        for (Map.Entry<String, Integer> entrada : quantidades.entrySet()) {
            EstoqueItem item = estoquePorProduto.get(entrada.getKey());
            if (item == null || !GRUPO_PELUCIAS.equals(item.getProduto().getGrupo())) {
                throw new RegraAbastecimentoException(
                        "Produto sem estoque pessoal válido: " + entrada.getKey() + "."
                );
            }

            List<Reserva> reservas = reservasPorProduto.getOrDefault(
                    entrada.getKey(),
                    List.of()
            );
            long reservadoTotal = reservas.stream()
                    .mapToLong(Reserva::getQuantidadeRestante)
                    .sum();
            long reservadoNoDestino = reservas.stream()
                    .filter(reserva -> reserva.getDestino() == local)
                    .mapToLong(Reserva::getQuantidadeRestante)
                    .sum();
            long livre = item.getQuantidade() - reservadoTotal;
            long disponivel = reservadoNoDestino + livre;

            if (entrada.getValue() > disponivel) {
                throw new RegraAbastecimentoException(
                        "Estoque insuficiente de " + entrada.getKey()
                                + ". Disponível: " + disponivel + "."
                );
            }
        }
    }

    private void consumirReservas(
            DestinoReserva local,
            int quantidade,
            List<Reserva> reservas,
            java.time.OffsetDateTime data
    ) {
        int restante = quantidade;
        for (Reserva reserva : reservas) {
            if (restante == 0) {
                return;
            }
            if (reserva.getDestino() != local) {
                continue;
            }
            int consumo = Math.min(restante, reserva.getQuantidadeRestante());
            reserva.registrarUtilizacao(consumo, data);
            restante -= consumo;
        }
    }

    private Map<String, EstoqueItem> indexarEstoque(List<EstoqueItem> itens) {
        Map<String, EstoqueItem> resultado = new LinkedHashMap<>();
        for (EstoqueItem item : itens) {
            resultado.put(item.getProduto().getId(), item);
        }
        return resultado;
    }

    private Map<String, List<Reserva>> indexarReservas(
            List<Reserva> reservas
    ) {
        Map<String, List<Reserva>> resultado = new LinkedHashMap<>();
        for (Reserva reserva : reservas) {
            resultado.computeIfAbsent(
                    reserva.getProduto().getId(),
                    ignorado -> new ArrayList<>()
            ).add(reserva);
        }
        return resultado;
    }

    private void validarResponsavel(
            String responsavelId,
            DestinoReserva local
    ) {
        if (!RESPONSAVEIS.get(local).contains(responsavelId)) {
            throw new RegraAbastecimentoException(
                    "Local inválido para o responsável."
            );
        }
    }

    private void validarMaquinaEProduto(
            DestinoReserva local,
            String maquinaId,
            String produtoId
    ) {
        Map<String, Set<String>> maquinas = PRODUTOS_POR_MAQUINA.get(local);
        Set<String> produtos = maquinas.get(maquinaId);
        if (produtos == null) {
            produtos = maquinas.get("*");
        }
        if (produtos == null || !produtos.contains(produtoId)) {
            throw new RegraAbastecimentoException(
                    "Máquina e produto incompatíveis."
            );
        }
    }

    private static Map<DestinoReserva, Map<String, Set<String>>>
            criarProdutosPorMaquina() {
        Map<DestinoReserva, Map<String, Set<String>>> locais =
                new EnumMap<>(DestinoReserva.class);
        locais.put(DestinoReserva.BOULEVARD, Map.of(
                "M1", Set.of("MIX", "PERSONAGENS"),
                "M2", Set.of("MIX", "PERSONAGENS"),
                "M3", Set.of("MIX", "PERSONAGENS"),
                "M4", Set.of("CAPIVARAS"),
                "M5", Set.of("BIG")
        ));
        locais.put(DestinoReserva.AEROPORTO, Map.of(
                "B01", Set.of("STITCH"),
                "B02", Set.of("CAPIVARAS"),
                "B03", Set.of("PERSONAGENS"),
                "GRANDE_DIREITA", Set.of("BIG"),
                "GRANDE_ESQUERDA", Set.of("BIG"),
                "B06", Set.of("MIX"),
                "B07", Set.of("LABUBU")
        ));
        locais.put(
                DestinoReserva.MERCADOS,
                Map.of("*", Set.of("MIX", "CAPIVARAS"))
        );
        locais.put(
                DestinoReserva.SUPERMAGO_BOA_VISTA,
                Map.of("*", Set.of("BIG"))
        );
        return Map.copyOf(locais);
    }
}
