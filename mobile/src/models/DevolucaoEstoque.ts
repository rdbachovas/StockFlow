import { DestinoReservaId } from "./DestinoReserva";
import { ProdutoId } from "./Produto";

export interface ParcelaReservaDevolucao {
    destinoId: DestinoReservaId;
    quantidade: number;
}

export interface ItemDevolucaoEstoque {
    produtoId: ProdutoId;

    quantidadeLivre: number;

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
