import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { Reserva, StatusReserva } from "../models/Reserva";

export class ReservaService {

    static criarReserva(
        estoque: Estoque,
        reservas: Reserva[],
        reserva: Reserva
    ): void {

        if (reserva.quantidade <= 0) {
            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        if (!estoque.responsavelId) {
            throw new Error(
                "A reserva deve ser criada a partir de um estoque pessoal."
            );
        }

        if (estoque.responsavelId !== reserva.responsavelId) {
            throw new Error(
                "O responsável pela reserva não corresponde ao estoque."
            );
        }

        const quantidadeEstoque =
            estoque.itens.find(
                (item) => item.produtoId === reserva.produtoId
            )?.quantidade ?? 0;

        const quantidadeReservada =
            this.quantidadeReservada(
                reservas,
                reserva.produtoId,
                reserva.responsavelId
            );

        const quantidadeDisponivel =
            quantidadeEstoque - quantidadeReservada;

        if (reserva.quantidade > quantidadeDisponivel) {
            throw new Error(
                "Quantidade insuficiente disponível para reserva."
            );
        }

        reserva.status = StatusReserva.ATIVA;

        reservas.push(reserva);
    }

    static cancelarReserva(
        reservas: Reserva[],
        reservaId: string,
        responsavelId: string
    ): void {

        const reserva = reservas.find(
            (reserva) =>
                reserva.id === reservaId &&
                reserva.responsavelId === responsavelId
        );

        if (!reserva) {
            throw new Error(
                "Reserva não encontrada."
            );
        }

        if (reserva.status !== StatusReserva.ATIVA) {
            throw new Error(
                "A reserva não está ativa."
            );
        }

        reserva.status = StatusReserva.CANCELADA;
    }

    static concluirReserva(
        reservas: Reserva[],
        reservaId: string,
        responsavelId: string
    ): void {

        const reserva = reservas.find(
            (reserva) =>
                reserva.id === reservaId &&
                reserva.responsavelId === responsavelId
        );

        if (!reserva) {
            throw new Error(
                "Reserva não encontrada."
            );
        }

        if (reserva.status !== StatusReserva.ATIVA) {
            throw new Error(
                "A reserva não está ativa."
            );
        }

        reserva.status = StatusReserva.CONCLUIDA;
    }

    static quantidadeReservada(
        reservas: Reserva[],
        produtoId: ProdutoId,
        responsavelId: string
    ): number {

        return reservas
            .filter(
                (reserva) =>
                    reserva.produtoId === produtoId &&
                    reserva.responsavelId === responsavelId &&
                    reserva.status === StatusReserva.ATIVA
            )
            .reduce(
                (total, reserva) =>
                    total + reserva.quantidade,
                0
            );
    }

    static quantidadeDisponivel(
        estoque: Estoque,
        reservas: Reserva[],
        produtoId: ProdutoId
    ): number {

        const quantidadeEstoque =
            estoque.itens.find(
                (item) => item.produtoId === produtoId
            )?.quantidade ?? 0;

        const responsavelId = estoque.responsavelId;

        if (!responsavelId) {
            return quantidadeEstoque;
        }

        const quantidadeReservada =
            this.quantidadeReservada(
                reservas,
                produtoId,
                responsavelId
            );

        return quantidadeEstoque - quantidadeReservada;
    }
}
