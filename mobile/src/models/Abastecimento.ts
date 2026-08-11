import { LocalId } from "./Local";
import { ItemAbastecimento } from "./ItemAbastecimento";

export interface Abastecimento {
    id: string;

    localId: LocalId;
    responsavelId: string;

    itens: ItemAbastecimento[];

    saldos?: Array<{
        produtoId: import("./Produto").ProdutoId;
        quantidade: number;
        saldoAnterior: number;
        saldoPosterior: number;
    }>;

    data: Date;

    observacao?: string;
}
