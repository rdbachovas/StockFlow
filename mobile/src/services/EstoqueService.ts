import { Estoque } from "../models/Estoque";
import { EstoqueItem } from "../models/EstoqueItem";
import { ProdutoId } from "../models/Produto";
import {
    Movimentacao,
    TipoMovimentacao
} from "../models/Movimentacao";

export class EstoqueService {

    static consultarQuantidade(
        estoque: Estoque,
        produtoId: ProdutoId
    ): number {

        const item = estoque.itens.find(
            (item) =>
                item.produtoId === produtoId
        );

        return item?.quantidade ?? 0;
    }

    static adicionar(
        estoque: Estoque,
        produtoId: ProdutoId,
        quantidade: number
    ): void {

        if (quantidade <= 0) {
            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        const item = estoque.itens.find(
            (item) =>
                item.produtoId === produtoId
        );

        if (item) {
            item.quantidade += quantidade;
            return;
        }

        const novoItem: EstoqueItem = {
            produtoId,
            quantidade
        };

        estoque.itens.push(novoItem);
    }

    static remover(
        estoque: Estoque,
        produtoId: ProdutoId,
        quantidade: number
    ): void {

        if (quantidade <= 0) {
            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        const item = estoque.itens.find(
            (item) =>
                item.produtoId === produtoId
        );

        if (!item) {
            throw new Error(
                "Produto não encontrado no estoque."
            );
        }

        if (item.quantidade < quantidade) {
            throw new Error(
                "Estoque insuficiente."
            );
        }

        item.quantidade -= quantidade;
    }

    static transferir(
        origem: Estoque,
        destino: Estoque,
        produtoId: ProdutoId,
        quantidade: number,
        responsavelId: string
    ): Movimentacao {

        if (quantidade <= 0) {
            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        this.remover(
            origem,
            produtoId,
            quantidade
        );

        this.adicionar(
            destino,
            produtoId,
            quantidade
        );

        const movimentacao: Movimentacao = {
            id: crypto.randomUUID(),

            tipo:
                TipoMovimentacao.TRANSFERENCIA_ENTRE_ESTOQUES,

            produtoId,
            quantidade,

            origemId: origem.id,
            destinoId: destino.id,

            responsavelId,

            data: new Date()
        };

        return movimentacao;
    }
}
