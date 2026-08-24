package br.com.stockflow.retirada;

import br.com.stockflow.auth.IdentidadeAtual;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.revisao.RevisaoService;
import br.com.stockflow.idempotencia.IdempotenciaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RetiradaService {

    private static final String ESTOQUE_PRINCIPAL =
            "ESTOQUE_PRINCIPAL";

    private final EstoqueRepository estoqueRepository;
    private final EstoqueItemRepository estoqueItemRepository;
    private final RetiradaRepository retiradaRepository;
    private final RevisaoService revisaoService;
    private final IdempotenciaService idempotenciaService;
    private final IdentidadeAtual identidadeAtual;

    public RetiradaService(
            EstoqueRepository estoqueRepository,
            EstoqueItemRepository estoqueItemRepository,
            RetiradaRepository retiradaRepository,
            RevisaoService revisaoService,
            IdempotenciaService idempotenciaService,
            IdentidadeAtual identidadeAtual
    ) {
        this.estoqueRepository = estoqueRepository;
        this.estoqueItemRepository = estoqueItemRepository;
        this.retiradaRepository = retiradaRepository;
        this.revisaoService = revisaoService;
        this.idempotenciaService = idempotenciaService;
        this.identidadeAtual = identidadeAtual;
    }

    @Transactional
    public RetiradaResponse registrar(RetiradaRequest request) {
        String responsavelId = identidadeAtual.id();
        return idempotenciaService.executar(
                request.commandId(), "RETIRADA", RetiradaResponse.class,
                () -> registrarNova(request, responsavelId), RetiradaResponse::revisao
        );
    }

    private RetiradaResponse registrarNova(
            RetiradaRequest request,
            String responsavelId
    ) {
        Estoque principal = estoqueRepository.findById(ESTOQUE_PRINCIPAL)
                .orElseThrow(() -> new RegraRetiradaException(
                        "Estoque Principal não encontrado."
                ));

        Estoque destino = estoqueRepository
                .findByResponsavelId(responsavelId)
                .orElseThrow(() -> new RegraRetiradaException(
                        "Responsável inválido."
                ));

        Map<String, RetiradaRequest.Item> solicitados =
                validarEIndexarItens(request.itens());

        List<EstoqueItem> itensPrincipais = estoqueItemRepository
                .buscarParaAtualizacao(
                        principal.getId(),
                        solicitados.keySet()
                );

        Map<String, EstoqueItem> principalPorProduto =
                new LinkedHashMap<>();

        for (EstoqueItem item : itensPrincipais) {
            principalPorProduto.put(
                    item.getProduto().getId(),
                    item
            );
        }

        Map<String, EstoqueItem> destinoPorProduto =
                new LinkedHashMap<>();

        for (RetiradaRequest.Item solicitado : solicitados.values()) {
            EstoqueItem itemPrincipal = principalPorProduto.get(
                    solicitado.produtoId()
            );

            if (
                    itemPrincipal == null ||
                    itemPrincipal.getQuantidade() < solicitado.quantidade()
            ) {
                int disponivel = itemPrincipal == null
                        ? 0
                        : itemPrincipal.getQuantidade();

                throw new RegraRetiradaException(
                        "Estoque principal insuficiente de " +
                                solicitado.produtoId() +
                                ". Disponível: " + disponivel + "."
                );
            }

            EstoqueItem itemDestino = estoqueItemRepository
                    .buscarPorEstoqueEProduto(
                            destino.getId(),
                            solicitado.produtoId()
                    )
                    .orElseGet(() -> new EstoqueItem(
                            destino,
                            itemPrincipal.getProduto(),
                            0
                    ));

            destinoPorProduto.put(
                    solicitado.produtoId(),
                    itemDestino
            );
        }

        Retirada retirada = new Retirada(
                destino.getResponsavel(),
                principal,
                destino,
                request.data(),
                request.observacao()
        );

        for (RetiradaRequest.Item solicitado : solicitados.values()) {
            EstoqueItem itemPrincipal = principalPorProduto.get(
                    solicitado.produtoId()
            );
            EstoqueItem itemDestino = destinoPorProduto.get(
                    solicitado.produtoId()
            );
            int saldoAnterior = itemPrincipal.getQuantidade();

            itemPrincipal.remover(solicitado.quantidade());
            itemDestino.adicionar(solicitado.quantidade());
            estoqueItemRepository.save(itemDestino);

            retirada.adicionarItem(new RetiradaItem(
                    retirada,
                    itemPrincipal.getProduto(),
                    solicitado.quantidade(),
                    saldoAnterior,
                    itemPrincipal.getQuantidade()
            ));
        }

        Retirada salva = retiradaRepository.save(retirada);
        return RetiradaResponse.de(salva, revisaoService.avancar());
    }

    private Map<String, RetiradaRequest.Item> validarEIndexarItens(
            List<RetiradaRequest.Item> itens
    ) {
        Map<String, RetiradaRequest.Item> itensPorProduto =
                new LinkedHashMap<>();

        for (RetiradaRequest.Item item : itens) {
            if (item.quantidade() <= 0) {
                throw new RegraRetiradaException(
                        "Todas as quantidades devem ser maiores que zero."
                );
            }

            if (itensPorProduto.putIfAbsent(item.produtoId(), item) != null) {
                throw new RegraRetiradaException(
                        "O produto " + item.produtoId() +
                                " foi informado mais de uma vez."
                );
            }
        }

        return itensPorProduto;
    }
}
