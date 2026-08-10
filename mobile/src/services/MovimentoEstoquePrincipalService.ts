import { Estoque } from "../models/Estoque";

import {
    MovimentoEstoquePrincipal,
    SolicitacaoMovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";

import { ProdutoId } from "../models/Produto";

import { EstoqueService } from "./EstoqueService";

export class MovimentoEstoquePrincipalService {

    static registrar(
        estoquePrincipal: Estoque,
        movimentos: MovimentoEstoquePrincipal[],
        solicitacao: SolicitacaoMovimentoEstoquePrincipal
    ): void {

        if (
            solicitacao.itens.length === 0
        ) {
            throw new Error(
                "Informe pelo menos um produto."
            );
        }

        const produtos =
            new Set<ProdutoId>();

        for (
            const item
            of solicitacao.itens
        ) {

            if (
                item.quantidade <= 0
            ) {
                throw new Error(
                    "Todas as quantidades devem ser maiores que zero."
                );
            }

            if (
                produtos.has(
                    item.produtoId
                )
            ) {
                throw new Error(
                    `${item.produtoId} foi informado mais de uma vez.`
                );
            }

            produtos.add(
                item.produtoId
            );

            if (
                solicitacao.tipo ===
                TipoMovimentoEstoquePrincipal.SAIDA
            ) {

                const atual =
                    EstoqueService
                        .consultarQuantidade(
                            estoquePrincipal,
                            item.produtoId
                        );

                if (
                    item.quantidade >
                    atual
                ) {
                    throw new Error(
                        `Estoque insuficiente de ${item.produtoId}. Atual: ${atual}.`
                    );
                }
            }
        }

        const itensRegistrados =
            solicitacao.itens.map(
                (item) => {

                    const saldoAnterior =
                        EstoqueService
                            .consultarQuantidade(
                                estoquePrincipal,
                                item.produtoId
                            );

                    const saldoPosterior =
                        solicitacao.tipo ===
                            TipoMovimentoEstoquePrincipal.ENTRADA
                            ? saldoAnterior +
                                item.quantidade
                            : saldoAnterior -
                                item.quantidade;

                    return {
                        produtoId:
                            item.produtoId,

                        quantidade:
                            item.quantidade,

                        saldoAnterior,

                        saldoPosterior
                    };
                }
            );

        for (
            const item
            of solicitacao.itens
        ) {

            if (
                solicitacao.tipo ===
                TipoMovimentoEstoquePrincipal.ENTRADA
            ) {

                EstoqueService.adicionar(
                    estoquePrincipal,
                    item.produtoId,
                    item.quantidade
                );

            } else {

                EstoqueService.remover(
                    estoquePrincipal,
                    item.produtoId,
                    item.quantidade
                );
            }
        }

        movimentos.push({

            id:
                solicitacao.id,

            tipo:
                solicitacao.tipo,

            responsavelId:
                solicitacao.responsavelId,

            itens:
                itensRegistrados,

            data:
                solicitacao.data,

            observacao:
                solicitacao.observacao
        });
    }
}
