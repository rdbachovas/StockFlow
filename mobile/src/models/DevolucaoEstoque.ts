import { DestinoReservaId } from "./DestinoReserva";
import { ProdutoId } from "./Produto";

export interface ParcelaReservaDevolucao {
    reservaId?: string;
    destinoId: DestinoReservaId;
    quantidade: number;
}

export interface ItemDevolucaoEstoque {
    produtoId: ProdutoId;

    quantidadeLivre: number;

    quantidadeReservada?: number;
    quantidadeTotal?: number;
    saldoPessoalAnterior?: number;
    saldoPessoalPosterior?: number;
    saldoPrincipalAnterior?: number;
    saldoPrincipalPosterior?: number;

    reservas: ParcelaReservaDevolucao[];
}

export interface DevolucaoEstoque {
    id: string;

    estoqueOrigemId: string;
    estoqueDestinoId: string;

    responsavelId: string;

    itens: ItemDevolucaoEstoque[];

    data: Date;

    observacao?: string;
}
