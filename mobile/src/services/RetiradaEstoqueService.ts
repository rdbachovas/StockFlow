import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";

import { EstoqueService } from "./EstoqueService";

export class RetiradaEstoqueService {

    static registrar(
        estoquePrincipal: Estoque,
        estoqueDestino: Estoque,
        retiradas: RetiradaEstoque[],
        retirada: RetiradaEstoque
    ): void {

        if (!estoqueDestino.responsavelId) {
            throw new Error(
                "O destino precisa ser um estoque pessoal."
            );
        }

        if (
            estoqueDestino.responsavelId !==
            retirada.responsavelId
        ) {
            throw new Error(
                "O responsável não corresponde ao estoque de destino."
            );
        }

        if (
            retirada.estoqueOrigemId !==
            estoquePrincipal.id
        ) {
            throw new Error(
                "A origem da retirada não corresponde ao estoque principal."
            );
        }

        if (
            retirada.estoqueDestinoId !==
            estoqueDestino.id
        ) {
            throw new Error(
                "O destino da retirada não corresponde ao estoque informado."
            );
        }

        if (retirada.itens.length === 0) {
            throw new Error(
                "Informe pelo menos um produto para retirar."
            );
        }

        const produtosRegistrados =
            new Set<ProdutoId>();

        // Valida tudo antes de alterar estoques.
        for (const item of retirada.itens) {

            if (item.quantidade <= 0) {
                throw new Error(
                    "Todas as quantidades devem ser maiores que zero."
                );
            }

            if (
                produtosRegistrados.has(
                    item.produtoId
                )
            ) {
                throw new Error(
                    `O produto ${item.produtoId} foi informado mais de uma vez.`
                );
            }

            produtosRegistrados.add(
                item.produtoId
            );

            const quantidadePrincipal =
                EstoqueService.consultarQuantidade(
                    estoquePrincipal,
                    item.produtoId
                );

            if (
                item.quantidade >
                quantidadePrincipal
            ) {
                throw new Error(
                    `Estoque principal insuficiente de ${item.produtoId}.`
                );
            }
        }

        // Só altera depois de validar todos os itens.
        for (const item of retirada.itens) {

            EstoqueService.remover(
                estoquePrincipal,
                item.produtoId,
                item.quantidade
            );

            EstoqueService.adicionar(
                estoqueDestino,
                item.produtoId,
                item.quantidade
            );
        }

        retiradas.push(
            retirada
        );
    }

    static calcularTotal(
        retirada: RetiradaEstoque
    ): number {

        return retirada.itens.reduce(
            (total, item) =>
                total + item.quantidade,
            0
        );
    }
}
