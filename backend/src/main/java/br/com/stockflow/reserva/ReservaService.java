package br.com.stockflow.reserva;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.revisao.RevisaoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservaService {

    private static final Map<DestinoReserva, Set<String>> PRODUTOS_POR_DESTINO =
            criarProdutosPorDestino();

    private static final Map<String, Set<DestinoReserva>> DESTINOS_POR_RESPONSAVEL =
            Map.of(
                    "RODRIGO", Set.of(
                            DestinoReserva.BOULEVARD,
                            DestinoReserva.MERCADOS,
                            DestinoReserva.SUPERMAGO_BOA_VISTA
                    ),
                    "CESAR", Set.of(
                            DestinoReserva.AEROPORTO,
                            DestinoReserva.MERCADOS,
                            DestinoReserva.SUPERMAGO_BOA_VISTA
                    )
            );

    private final EstoqueRepository estoqueRepository;
    private final EstoqueItemRepository estoqueItemRepository;
    private final ReservaRepository reservaRepository;
    private final RevisaoService revisaoService;

    public ReservaService(
            EstoqueRepository estoqueRepository,
            EstoqueItemRepository estoqueItemRepository,
            ReservaRepository reservaRepository,
            RevisaoService revisaoService
    ) {
        this.estoqueRepository = estoqueRepository;
        this.estoqueItemRepository = estoqueItemRepository;
        this.reservaRepository = reservaRepository;
        this.revisaoService = revisaoService;
    }

    @Transactional
    public ReservaResponse criar(ReservaRequest request) {
        validarDestino(request.responsavelId(), request.destino());
        validarProduto(request.produtoId(), request.destino());

        Estoque estoque = estoqueRepository
                .findByResponsavelId(request.responsavelId())
                .orElseThrow(() -> new RegraReservaException(
                        "Responsável inválido."
                ));

        EstoqueItem item = estoqueItemRepository.buscarUmParaAtualizacao(
                estoque.getId(),
                request.produtoId()
        ).orElseThrow(() -> new RegraReservaException(
                "Produto sem estoque físico para o responsável."
        ));

        long reservado = reservaRepository.somarQuantidadeRestanteAtiva(
                request.responsavelId(),
                request.produtoId()
        );
        long livre = item.getQuantidade() - reservado;

        if (request.quantidade() > livre) {
            throw new RegraReservaException(
                    "Estoque livre insuficiente. Disponível: " + livre + "."
            );
        }

        Reserva reserva = new Reserva(
                estoque.getResponsavel(),
                request.destino(),
                item.getProduto(),
                request.quantidade(),
                OffsetDateTime.now(ZoneOffset.UTC)
        );

        return ReservaResponse.de(
                reservaRepository.save(reserva),
                revisaoService.avancar()
        );
    }

    @Transactional
    public ReservaResponse cancelar(
            UUID id,
            CancelamentoReservaRequest request
    ) {
        Reserva reserva = reservaRepository.buscarParaCancelamento(id)
                .orElseThrow(() -> new RegraReservaException(
                        "Reserva não encontrada."
                ));

        if (!reserva.getResponsavel().getId().equals(request.responsavelId())) {
            throw new RegraReservaException(
                    "A reserva não pertence ao responsável informado."
            );
        }
        if (reserva.getStatus() != StatusReserva.ATIVA) {
            throw new RegraReservaException("A reserva não está ativa.");
        }

        reserva.cancelar(OffsetDateTime.now(ZoneOffset.UTC));
        return ReservaResponse.de(reserva, revisaoService.avancar());
    }

    private void validarDestino(
            String responsavelId,
            DestinoReserva destino
    ) {
        Set<DestinoReserva> destinos = DESTINOS_POR_RESPONSAVEL.get(
                responsavelId
        );
        if (destinos == null || !destinos.contains(destino)) {
            throw new RegraReservaException(
                    "Destino inválido para o responsável."
            );
        }
    }

    private void validarProduto(
            String produtoId,
            DestinoReserva destino
    ) {
        if (!PRODUTOS_POR_DESTINO.get(destino).contains(produtoId)) {
            throw new RegraReservaException(
                    "Produto inválido para o destino."
            );
        }
    }

    private static Map<DestinoReserva, Set<String>> criarProdutosPorDestino() {
        Map<DestinoReserva, Set<String>> produtos =
                new EnumMap<>(DestinoReserva.class);
        produtos.put(
                DestinoReserva.BOULEVARD,
                Set.of("MIX", "PERSONAGENS", "CAPIVARAS", "BIG")
        );
        produtos.put(
                DestinoReserva.AEROPORTO,
                Set.of(
                        "STITCH",
                        "CAPIVARAS",
                        "PERSONAGENS",
                        "BIG",
                        "MIX",
                        "LABUBU"
                )
        );
        produtos.put(
                DestinoReserva.MERCADOS,
                Set.of("MIX", "CAPIVARAS")
        );
        produtos.put(
                DestinoReserva.SUPERMAGO_BOA_VISTA,
                Set.of("BIG")
        );
        return Map.copyOf(produtos);
    }
}
