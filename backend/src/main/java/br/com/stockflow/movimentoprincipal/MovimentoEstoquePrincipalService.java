package br.com.stockflow.movimentoprincipal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.estoque.EstoqueItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovimentoEstoquePrincipalService {

    private static final String ESTOQUE_PRINCIPAL = "ESTOQUE_PRINCIPAL";

    private final EstoqueItemRepository estoqueItemRepository;
    private final MovimentoEstoquePrincipalRepository movimentoRepository;

    public MovimentoEstoquePrincipalService(
            EstoqueItemRepository estoqueItemRepository,
            MovimentoEstoquePrincipalRepository movimentoRepository
    ) {
        this.estoqueItemRepository = estoqueItemRepository;
        this.movimentoRepository = movimentoRepository;
    }

    @Transactional
    public MovimentoEstoquePrincipalResponse registrar(
            MovimentoEstoquePrincipalRequest request
    ) {
        Map<String, MovimentoEstoquePrincipalRequest.Item> solicitados =
                validarEIndexar(request.itens());
        Map<String, EstoqueItem> estoquePorProduto = indexarEstoque(
                estoqueItemRepository.buscarParaAtualizacao(
                        ESTOQUE_PRINCIPAL,
                        solicitados.keySet()
                )
        );

        validarDisponibilidade(request.tipo(), solicitados, estoquePorProduto);

        MovimentoEstoquePrincipal movimento = new MovimentoEstoquePrincipal(
                request.tipo(),
                request.data(),
                request.observacao()
        );
        for (MovimentoEstoquePrincipalRequest.Item solicitado
                : solicitados.values()) {
            EstoqueItem item = estoquePorProduto.get(solicitado.produtoId());
            int saldoAnterior = item.getQuantidade();
            if (request.tipo() == TipoMovimentoEstoquePrincipal.ENTRADA) {
                item.adicionar(solicitado.quantidade());
            } else {
                item.remover(solicitado.quantidade());
            }
            movimento.adicionarItem(new MovimentoEstoquePrincipalItem(
                    movimento,
                    item.getProduto(),
                    solicitado.quantidade(),
                    saldoAnterior,
                    item.getQuantidade()
            ));
        }

        return MovimentoEstoquePrincipalResponse.de(
                movimentoRepository.save(movimento)
        );
    }

    private Map<String, MovimentoEstoquePrincipalRequest.Item> validarEIndexar(
            List<MovimentoEstoquePrincipalRequest.Item> itens
    ) {
        Map<String, MovimentoEstoquePrincipalRequest.Item> resultado =
                new LinkedHashMap<>();
        for (MovimentoEstoquePrincipalRequest.Item item : itens) {
            if (resultado.putIfAbsent(item.produtoId(), item) != null) {
                throw new RegraMovimentoEstoquePrincipalException(
                        "O produto " + item.produtoId()
                                + " foi informado mais de uma vez."
                );
            }
        }
        return resultado;
    }

    private void validarDisponibilidade(
            TipoMovimentoEstoquePrincipal tipo,
            Map<String, MovimentoEstoquePrincipalRequest.Item> solicitados,
            Map<String, EstoqueItem> estoquePorProduto
    ) {
        for (MovimentoEstoquePrincipalRequest.Item solicitado
                : solicitados.values()) {
            EstoqueItem item = estoquePorProduto.get(solicitado.produtoId());
            if (item == null) {
                throw new RegraMovimentoEstoquePrincipalException(
                        "Produto inválido: " + solicitado.produtoId() + "."
                );
            }
            if (tipo == TipoMovimentoEstoquePrincipal.SAIDA
                    && solicitado.quantidade() > item.getQuantidade()) {
                throw new RegraMovimentoEstoquePrincipalException(
                        "Estoque Principal insuficiente de "
                                + solicitado.produtoId() + "."
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
