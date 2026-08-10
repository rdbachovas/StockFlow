import {
    ConsumoCarrinho,
    SolicitacaoConsumoCarrinho
} from "../models/ConsumoCarrinho";

import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";

import {
    PRODUTOS_CARRINHO
} from "../utils/ProdutoUtils";

import { EstoqueService } from "./EstoqueService";

export class ConsumoCarrinhoService {

    static registrar(
        estoquePessoal: Estoque,
        consumos: ConsumoCarrinho[],
        solicitacao: SolicitacaoConsumoCarrinho
    ): void {

        if (
            !estoquePessoal.responsavelId
        ) {
            throw new Error(
                "O consumo deve utilizar um estoque pessoal."
            );
        }

        if (
            estoquePessoal.responsavelId !==
            solicitacao.responsavelId
        ) {
            throw new Error(
                "O responsável não corresponde ao estoque pessoal."
            );
        }

        if (
            solicitacao.itens.length === 0
        ) {
            throw new Error(
                "Informe pelo menos um insumo."
            );
        }

        const produtos =
            new Set<ProdutoId>();

        for (
            const item
            of solicitacao.itens
        ) {

            if (
                !PRODUTOS_CARRINHO.includes(
                    item.produtoId
                )
            ) {
                throw new Error(
                    `${item.produtoId} não é um insumo do carrinho.`
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
                item.quantidade <= 0
            ) {
                throw new Error(
                    "A quantidade consumida deve ser maior que zero."
                );
            }

            const atual =
                EstoqueService
                    .consultarQuantidade(
                        estoquePessoal,
                        item.produtoId
                    );

            if (
                item.quantidade >
                atual
            ) {
                throw new Error(
                    `Estoque insuficiente de ${item.produtoId}. Disponível: ${atual}.`
                );
            }
        }

        const itensRegistrados =
            solicitacao.itens.map(
                (item) => {

                    const saldoAnterior =
                        EstoqueService
                            .consultarQuantidade(
                                estoquePessoal,
                                item.produtoId
                            );

                    return {
                        produtoId:
                            item.produtoId,

                        quantidade:
                            item.quantidade,

                        saldoAnterior,

                        saldoPosterior:
                            saldoAnterior -
                            item.quantidade
                    };
                }
            );

        for (
            const item
            of solicitacao.itens
        ) {

            EstoqueService.remover(
                estoquePessoal,
                item.produtoId,
                item.quantidade
            );
        }

        consumos.push({
            id:
                solicitacao.id,

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
