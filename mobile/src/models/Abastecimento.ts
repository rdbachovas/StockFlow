import { LocalId } from "./Local";
import { ItemAbastecimento } from "./ItemAbastecimento";

export interface Abastecimento {
    id: string;

    localId: LocalId;
    responsavelId: string;

    itens: ItemAbastecimento[];

    data: Date;

    observacao?: string;
}
