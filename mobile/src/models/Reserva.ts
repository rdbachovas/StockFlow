import { ProdutoId } from "./Produto";
import { LocalId } from "./Local";

export enum StatusReserva {
    ATIVA = "ATIVA",
    CANCELADA = "CANCELADA",
    CONCLUIDA = "CONCLUIDA",
}

export interface Reserva {
    id: string;
    responsavelId: string;
    localDestinoId: LocalId;
    produtoId: ProdutoId;
    quantidade: number;
    status: StatusReserva;
}
