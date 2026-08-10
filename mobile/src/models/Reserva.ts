import { DestinoReservaId } from "./DestinoReserva";
import { ProdutoId } from "./Produto";

export enum StatusReserva {
    ATIVA = "ATIVA",
    CANCELADA = "CANCELADA",
    CONCLUIDA = "CONCLUIDA"
}

export enum TipoEventoReserva {
    CRIACAO = "CRIACAO",
    UTILIZACAO = "UTILIZACAO",
    LIBERACAO = "LIBERACAO",
    CANCELAMENTO = "CANCELAMENTO",
    CONCLUSAO = "CONCLUSAO"
}

export interface EventoReserva {
    id: string;

    tipo: TipoEventoReserva;

    quantidade: number;

    data: Date;

    observacao?: string;
}

export interface Reserva {
    id: string;

    responsavelId: string;

    destinoId: DestinoReservaId;

    produtoId: ProdutoId;

    quantidade: number;

    quantidadeUtilizada: number;

    quantidadeLiberada?: number;

    status: StatusReserva;

    dataCriacao?: Date;

    historico?: EventoReserva[];
}
