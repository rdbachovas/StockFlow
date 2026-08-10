import { ProdutoId } from "./Produto";

export enum TipoMovimentoEstoquePrincipal {
    ENTRADA = "ENTRADA",
    SAIDA = "SAIDA"
}

export interface ItemSolicitacaoMovimentoEstoquePrincipal {
    produtoId: ProdutoId;
    quantidade: number;
}

export interface ItemMovimentoEstoquePrincipal {
    produtoId: ProdutoId;

    quantidade: number;

    saldoAnterior: number;

    saldoPosterior: number;
}

export interface SolicitacaoMovimentoEstoquePrincipal {
    id: string;

    tipo: TipoMovimentoEstoquePrincipal;

    responsavelId: string;

    itens: ItemSolicitacaoMovimentoEstoquePrincipal[];

    data: Date;

    observacao?: string;
}

export interface MovimentoEstoquePrincipal {
    id: string;

    tipo: TipoMovimentoEstoquePrincipal;

    responsavelId: string;

    itens: ItemMovimentoEstoquePrincipal[];

    data: Date;

    observacao?: string;
}
