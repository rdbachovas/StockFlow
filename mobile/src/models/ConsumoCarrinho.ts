import { ProdutoId } from "./Produto";

export interface ItemSolicitacaoConsumoCarrinho {
    produtoId: ProdutoId;
    quantidade: number;
}

export interface ItemConsumoCarrinho {
    produtoId: ProdutoId;

    quantidade: number;

    saldoAnterior: number;

    saldoPosterior: number;
}

export interface SolicitacaoConsumoCarrinho {
    id: string;

    responsavelId: string;

    itens: ItemSolicitacaoConsumoCarrinho[];

    data: Date;

    observacao?: string;
}

export interface ConsumoCarrinho {
    id: string;

    responsavelId: string;

    itens: ItemConsumoCarrinho[];

    data: Date;

    observacao?: string;
}
