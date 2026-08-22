package br.com.stockflow.devolucao;

import br.com.stockflow.auth.IdentidadeAtual;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.reserva.DestinoReserva;
import br.com.stockflow.reserva.Reserva;
import br.com.stockflow.reserva.ReservaRepository;
import br.com.stockflow.revisao.RevisaoService;
import br.com.stockflow.idempotencia.IdempotenciaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevolucaoService {

    private static final String ESTOQUE_PRINCIPAL = "ESTOQUE_PRINCIPAL";

    private final EstoqueRepository estoqueRepository;
    private final EstoqueItemRepository estoqueItemRepository;
    private final ReservaRepository reservaRepository;
    private final DevolucaoRepository devolucaoRepository;
    private final RevisaoService revisaoService;
    private final IdempotenciaService idempotenciaService;
    private final IdentidadeAtual identidadeAtual;

    public DevolucaoService(
            EstoqueRepository estoqueRepository,
            EstoqueItemRepository estoqueItemRepository,
            ReservaRepository reservaRepository,
            DevolucaoRepository devolucaoRepository,
            RevisaoService revisaoService,
            IdempotenciaService idempotenciaService,
            IdentidadeAtual identidadeAtual
    ) {
        this.estoqueRepository = estoqueRepository;
        this.estoqueItemRepository = estoqueItemRepository;
        this.reservaRepository = reservaRepository;
        this.devolucaoRepository = devolucaoRepository;
        this.revisaoService = revisaoService;
        this.idempotenciaService = idempotenciaService;
        this.identidadeAtual = identidadeAtual;
    }

    @Transactional
    public DevolucaoResponse registrar(DevolucaoRequest request) {
        identidadeAtual.exigirIgual(request.responsavelId());
        return idempotenciaService.executar(
                request.commandId(), "DEVOLUCAO", DevolucaoResponse.class,
                () -> registrarNova(request), DevolucaoResponse::revisao
        );
    }

    private DevolucaoResponse registrarNova(DevolucaoRequest request) {
        Map<String, ItemSolicitado> solicitados = validarEIndexar(request);
        Estoque pessoal = estoqueRepository
                .findByResponsavelId(request.responsavelId())
                .orElseThrow(() -> new RegraDevolucaoException(
                        "Responsável inválido."
                ));
        Estoque principal = estoqueRepository.findById(ESTOQUE_PRINCIPAL)
                .orElseThrow(() -> new RegraDevolucaoException(
                        "Estoque Principal não encontrado."
                ));

        Map<String, EstoqueItem> pessoalPorProduto = indexarEstoque(
                estoqueItemRepository.buscarParaAtualizacao(
                        pessoal.getId(),
                        solicitados.keySet()
                )
        );
        Map<String, EstoqueItem> principalPorProduto = indexarEstoque(
                estoqueItemRepository.buscarParaAtualizacao(
                        principal.getId(),
                        solicitados.keySet()
                )
        );
        Map<String, List<Reserva>> reservasPorProduto = indexarReservas(
                reservaRepository.buscarAtivasParaAbastecimento(
                        request.responsavelId(),
                        solicitados.keySet()
                )
        );

        validarDisponibilidade(
                solicitados,
                pessoalPorProduto,
                principalPorProduto,
                reservasPorProduto
        );

        Devolucao devolucao = new Devolucao(
                pessoal.getResponsavel(),
                pessoal,
                principal,
                request.data(),
                request.observacao()
        );

        for (ItemSolicitado solicitado : solicitados.values()) {
            EstoqueItem itemPessoal = pessoalPorProduto.get(
                    solicitado.produtoId()
            );
            EstoqueItem itemPrincipal = principalPorProduto.get(
                    solicitado.produtoId()
            );
            int pessoalAnterior = itemPessoal.getQuantidade();
            int principalAnterior = itemPrincipal.getQuantidade();

            List<AlocacaoReserva> alocacoes = liberarReservas(
                    solicitado,
                    reservasPorProduto.getOrDefault(
                            solicitado.produtoId(),
                            List.of()
                    ),
                    request.data()
            );
            itemPessoal.remover(solicitado.quantidadeTotal());
            itemPrincipal.adicionar(solicitado.quantidadeTotal());

            DevolucaoItem itemDevolucao = new DevolucaoItem(
                    devolucao,
                    itemPessoal.getProduto(),
                    solicitado.quantidadeLivre(),
                    solicitado.quantidadeReservada(),
                    pessoalAnterior,
                    itemPessoal.getQuantidade(),
                    principalAnterior,
                    itemPrincipal.getQuantidade()
            );
            for (AlocacaoReserva alocacao : alocacoes) {
                itemDevolucao.adicionarReserva(new DevolucaoReserva(
                        itemDevolucao,
                        alocacao.reserva(),
                        alocacao.quantidade()
                ));
            }
            devolucao.adicionarItem(itemDevolucao);
        }

        return DevolucaoResponse.de(
                devolucaoRepository.save(devolucao),
                revisaoService.avancar()
        );
    }

    private Map<String, ItemSolicitado> validarEIndexar(
            DevolucaoRequest request
    ) {
        Map<String, ItemSolicitado> resultado = new LinkedHashMap<>();
        for (DevolucaoRequest.Item item : request.itens()) {
            Map<DestinoReserva, Integer> porDestino =
                    new EnumMap<>(DestinoReserva.class);
            for (DevolucaoRequest.ParcelaReserva parcela : item.reservas()) {
                porDestino.merge(
                        parcela.destino(),
                        parcela.quantidade(),
                        Math::addExact
                );
            }
            int reservada = porDestino.values().stream()
                    .mapToInt(Integer::intValue)
                    .sum();
            if (item.quantidadeLivre() == 0 && reservada == 0) {
                throw new RegraDevolucaoException(
                        "A quantidade total deve ser maior que zero."
                );
            }
            ItemSolicitado solicitado = new ItemSolicitado(
                    item.produtoId(),
                    item.quantidadeLivre(),
                    reservada,
                    Map.copyOf(porDestino)
            );
            if (resultado.putIfAbsent(item.produtoId(), solicitado) != null) {
                throw new RegraDevolucaoException(
                        "O produto " + item.produtoId()
                                + " foi informado mais de uma vez."
                );
            }
        }
        return resultado;
    }

    private void validarDisponibilidade(
            Map<String, ItemSolicitado> solicitados,
            Map<String, EstoqueItem> pessoalPorProduto,
            Map<String, EstoqueItem> principalPorProduto,
            Map<String, List<Reserva>> reservasPorProduto
    ) {
        for (ItemSolicitado solicitado : solicitados.values()) {
            EstoqueItem pessoal = pessoalPorProduto.get(solicitado.produtoId());
            EstoqueItem principal = principalPorProduto.get(
                    solicitado.produtoId()
            );
            if (pessoal == null || principal == null) {
                throw new RegraDevolucaoException(
                        "Produto sem estoque válido: " + solicitado.produtoId() + "."
                );
            }
            if (solicitado.quantidadeTotal() > pessoal.getQuantidade()) {
                throw new RegraDevolucaoException("Estoque pessoal insuficiente.");
            }

            List<Reserva> reservas = reservasPorProduto.getOrDefault(
                    solicitado.produtoId(),
                    List.of()
            );
            long reservadoTotal = reservas.stream()
                    .mapToLong(Reserva::getQuantidadeRestante)
                    .sum();
            long livre = pessoal.getQuantidade() - reservadoTotal;
            if (solicitado.quantidadeLivre() > livre) {
                throw new RegraDevolucaoException(
                        "Quantidade livre insuficiente. Disponível: " + livre + "."
                );
            }

            for (Map.Entry<DestinoReserva, Integer> parcela
                    : solicitado.porDestino().entrySet()) {
                long restanteDestino = reservas.stream()
                        .filter(reserva -> reserva.getDestino() == parcela.getKey())
                        .mapToLong(Reserva::getQuantidadeRestante)
                        .sum();
                if (parcela.getValue() > restanteDestino) {
                    throw new RegraDevolucaoException(
                            "Reserva ativa insuficiente para o destino "
                                    + parcela.getKey() + "."
                    );
                }
            }
        }
    }

    private List<AlocacaoReserva> liberarReservas(
            ItemSolicitado solicitado,
            List<Reserva> reservas,
            java.time.OffsetDateTime data
    ) {
        List<AlocacaoReserva> alocacoes = new ArrayList<>();
        for (Map.Entry<DestinoReserva, Integer> parcela
                : solicitado.porDestino().entrySet()) {
            int restante = parcela.getValue();
            for (Reserva reserva : reservas) {
                if (restante == 0) {
                    break;
                }
                if (reserva.getDestino() != parcela.getKey()) {
                    continue;
                }
                int quantidade = Math.min(
                        restante,
                        reserva.getQuantidadeRestante()
                );
                reserva.registrarLiberacao(quantidade, data);
                alocacoes.add(new AlocacaoReserva(reserva, quantidade));
                restante -= quantidade;
            }
        }
        return alocacoes;
    }

    private Map<String, EstoqueItem> indexarEstoque(List<EstoqueItem> itens) {
        Map<String, EstoqueItem> resultado = new LinkedHashMap<>();
        for (EstoqueItem item : itens) {
            resultado.put(item.getProduto().getId(), item);
        }
        return resultado;
    }

    private Map<String, List<Reserva>> indexarReservas(List<Reserva> reservas) {
        Map<String, List<Reserva>> resultado = new LinkedHashMap<>();
        for (Reserva reserva : reservas) {
            resultado.computeIfAbsent(
                    reserva.getProduto().getId(),
                    ignorado -> new ArrayList<>()
            ).add(reserva);
        }
        return resultado;
    }

    private record ItemSolicitado(
            String produtoId,
            int quantidadeLivre,
            int quantidadeReservada,
            Map<DestinoReserva, Integer> porDestino
    ) {
        int quantidadeTotal() {
            return quantidadeLivre + quantidadeReservada;
        }
    }

    private record AlocacaoReserva(Reserva reserva, int quantidade) {
    }
}
