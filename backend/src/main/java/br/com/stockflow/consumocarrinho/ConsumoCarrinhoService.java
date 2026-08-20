package br.com.stockflow.consumocarrinho;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.revisao.RevisaoService;
import br.com.stockflow.idempotencia.IdempotenciaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsumoCarrinhoService {

    private static final Set<String> PRODUTOS_PERMITIDOS = Set.of(
            "MILHO",
            "CHOCOLATE",
            "EMBALAGEM_CARRINHO_MEDIA",
            "EMBALAGEM_CARRINHO_GRANDE",
            "OLEO"
    );

    private final EstoqueRepository estoqueRepository;
    private final EstoqueItemRepository estoqueItemRepository;
    private final ConsumoCarrinhoRepository consumoRepository;
    private final RevisaoService revisaoService;
    private final IdempotenciaService idempotenciaService;

    public ConsumoCarrinhoService(
            EstoqueRepository estoqueRepository,
            EstoqueItemRepository estoqueItemRepository,
            ConsumoCarrinhoRepository consumoRepository,
            RevisaoService revisaoService,
            IdempotenciaService idempotenciaService
    ) {
        this.estoqueRepository = estoqueRepository;
        this.estoqueItemRepository = estoqueItemRepository;
        this.consumoRepository = consumoRepository;
        this.revisaoService = revisaoService;
        this.idempotenciaService = idempotenciaService;
    }

    @Transactional
    public ConsumoCarrinhoResponse registrar(ConsumoCarrinhoRequest request) {
        return idempotenciaService.executar(
                request.commandId(), "CONSUMO_CARRINHO",
                ConsumoCarrinhoResponse.class,
                () -> registrarNovo(request), ConsumoCarrinhoResponse::revisao
        );
    }

    private ConsumoCarrinhoResponse registrarNovo(ConsumoCarrinhoRequest request) {
        Map<String, ConsumoCarrinhoRequest.Item> solicitados =
                validarEIndexar(request.itens());
        Estoque pessoal = estoqueRepository
                .findByResponsavelId(request.responsavelId())
                .orElseThrow(() -> new RegraConsumoCarrinhoException(
                        "Responsável inválido."
                ));
        Map<String, EstoqueItem> estoquePorProduto = indexarEstoque(
                estoqueItemRepository.buscarParaAtualizacao(
                        pessoal.getId(),
                        solicitados.keySet()
                )
        );
        validarDisponibilidade(solicitados, estoquePorProduto);

        ConsumoCarrinho consumo = new ConsumoCarrinho(
                pessoal.getResponsavel(),
                pessoal,
                request.data(),
                request.observacao()
        );
        for (ConsumoCarrinhoRequest.Item solicitado : solicitados.values()) {
            EstoqueItem item = estoquePorProduto.get(solicitado.produtoId());
            int saldoAnterior = item.getQuantidade();
            item.remover(solicitado.quantidade());
            consumo.adicionarItem(new ConsumoCarrinhoItem(
                    consumo,
                    item.getProduto(),
                    solicitado.quantidade(),
                    saldoAnterior,
                    item.getQuantidade()
            ));
        }

        return ConsumoCarrinhoResponse.de(
                consumoRepository.save(consumo),
                revisaoService.avancar()
        );
    }

    private Map<String, ConsumoCarrinhoRequest.Item> validarEIndexar(
            List<ConsumoCarrinhoRequest.Item> itens
    ) {
        Map<String, ConsumoCarrinhoRequest.Item> resultado =
                new LinkedHashMap<>();
        for (ConsumoCarrinhoRequest.Item item : itens) {
            if (!PRODUTOS_PERMITIDOS.contains(item.produtoId())) {
                throw new RegraConsumoCarrinhoException(
                        "Produto inválido para consumo do carrinho."
                );
            }
            if (resultado.putIfAbsent(item.produtoId(), item) != null) {
                throw new RegraConsumoCarrinhoException(
                        "O produto " + item.produtoId()
                                + " foi informado mais de uma vez."
                );
            }
        }
        return resultado;
    }

    private void validarDisponibilidade(
            Map<String, ConsumoCarrinhoRequest.Item> solicitados,
            Map<String, EstoqueItem> estoquePorProduto
    ) {
        for (ConsumoCarrinhoRequest.Item solicitado : solicitados.values()) {
            EstoqueItem item = estoquePorProduto.get(solicitado.produtoId());
            if (item == null || item.getQuantidade() < solicitado.quantidade()) {
                int disponivel = item == null ? 0 : item.getQuantidade();
                throw new RegraConsumoCarrinhoException(
                        "Estoque pessoal insuficiente de "
                                + solicitado.produtoId()
                                + ". Disponível: " + disponivel + "."
                );
            }
        }
    }

    private Map<String, EstoqueItem> indexarEstoque(List<EstoqueItem> itens) {
        Map<String, EstoqueItem> resultado = new LinkedHashMap<>();
        for (EstoqueItem item : itens) {
            resultado.put(item.getProduto().getId(), item);
        }
        return resultado;
    }
}
