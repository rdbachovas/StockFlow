import { ItemRetiradaEstoque } from "./ItemRetiradaEstoque";

export interface RetiradaEstoque {
    id: string;

    estoqueOrigemId: string;
    estoqueDestinoId: string;

    responsavelId: string;

    itens: ItemRetiradaEstoque[];

    data: Date;

    observacao?: string;
}
