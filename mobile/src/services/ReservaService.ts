import { DestinoReservaId } from "../models/DestinoReserva";
import { Estoque } from "../models/Estoque";
import { LocalId } from "../models/Local";
import { ProdutoId } from "../models/Produto";

import {
    Reserva,
    StatusReserva,
    TipoEventoReserva
} from "../models/Reserva";

import { UsuarioId } from "../models/Usuario";

export class ReservaService {

    private static quantidadeLiberada(
        reserva: Reserva
    ): number {

        return (
            reserva.quantidadeLiberada ??
            0
        );
    }

    private static registrarEvento(
        reserva: Reserva,
        tipo: TipoEventoReserva,
        quantidade: number,
        observacao?: string
    ): void {

        if (
            !reserva.historico
        ) {
            reserva.historico = [];
        }

        reserva.historico.push({
            id:
                `EV_RES_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            tipo,

            quantidade,

            data:
                new Date(),

            observacao
        });
    }

    static criarReserva(
        estoque: Estoque,
        reservas: Reserva[],
        reserva: Reserva
    ): void {

        if (!estoque.responsavelId) {

            throw new Error(
                "A reserva precisa utilizar um estoque pessoal."
            );
        }

        if (
            estoque.responsavelId !==
            reserva.responsavelId
        ) {

            throw new Error(
                "O responsável da reserva não corresponde ao estoque."
            );
        }

        if (
            reserva.quantidade <= 0
        ) {

            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        if (
            reserva.quantidadeUtilizada !==
            0
        ) {

            throw new Error(
                "Uma nova reserva deve começar sem utilização."
            );
        }

        if (
            this.quantidadeLiberada(
                reserva
            ) !== 0
        ) {

            throw new Error(
                "Uma nova reserva deve começar sem quantidade liberada."
            );
        }

        if (
            reserva.status !==
            StatusReserva.ATIVA
        ) {

            throw new Error(
                "Uma nova reserva deve começar ativa."
            );
        }

        if (
            !this.destinoPermitidoParaResponsavel(
                reserva.destinoId,
                reserva.responsavelId
            )
        ) {

            throw new Error(
                "Esse responsável não pode reservar para esse destino."
            );
        }

        const produtosPermitidos =
            this.listarProdutosPermitidos(
                reserva.destinoId
            );

        if (
            !produtosPermitidos.includes(
                reserva.produtoId
            )
        ) {

            throw new Error(
                `${reserva.produtoId} não é permitido nesse destino.`
            );
        }

        const disponivel =
            this.quantidadeDisponivel(
                estoque,
                reservas,
                reserva.produtoId
            );

        if (
            reserva.quantidade >
            disponivel
        ) {

            throw new Error(
                `Disponível insuficiente. Você possui ${disponivel} livres.`
            );
        }

        reserva.quantidadeLiberada =
            0;

        reserva.dataCriacao =
            new Date();

        reserva.historico =
            [];

        this.registrarEvento(
            reserva,
            TipoEventoReserva.CRIACAO,
            reserva.quantidade,
            "Reserva criada"
        );

        reservas.push(
            reserva
        );
    }

    static cancelarReserva(
        reservas: Reserva[],
        reservaId: string,
        responsavelId: string
    ): void {

        const reserva =
            reservas.find(
                (item) =>
                    item.id ===
                    reservaId
            );

        if (!reserva) {

            throw new Error(
                "Reserva não encontrada."
            );
        }

        if (
            reserva.responsavelId !==
            responsavelId
        ) {

            throw new Error(
                "Essa reserva pertence a outro responsável."
            );
        }

        if (
            reserva.status !==
            StatusReserva.ATIVA
        ) {

            throw new Error(
                "Somente reservas ativas podem ser canceladas."
            );
        }

        const restante =
            this.quantidadeRestante(
                reserva
            );

        reserva.quantidadeLiberada =
            this.quantidadeLiberada(
                reserva
            ) +
            restante;

        this.registrarEvento(
            reserva,
            TipoEventoReserva.CANCELAMENTO,
            restante,
            "Quantidade restante liberada pelo cancelamento"
        );

        reserva.status =
            StatusReserva.CANCELADA;
    }

    static quantidadeRestante(
        reserva: Reserva
    ): number {

        return Math.max(
            reserva.quantidade -
            reserva.quantidadeUtilizada -
            this.quantidadeLiberada(
                reserva
            ),
            0
        );
    }

    static quantidadeReservada(
        reservas: Reserva[],
        produtoId: ProdutoId,
        responsavelId: string
    ): number {

        return reservas
            .filter(
                (reserva) =>
                    reserva.responsavelId ===
                        responsavelId &&
                    reserva.produtoId ===
                        produtoId &&
                    reserva.status ===
                        StatusReserva.ATIVA
            )
            .reduce(
                (total, reserva) =>
                    total +
                    this.quantidadeRestante(
                        reserva
                    ),
                0
            );
    }

    static quantidadeReservadaNoDestino(
        reservas: Reserva[],
        produtoId: ProdutoId,
        responsavelId: string,
        destinoId: DestinoReservaId
    ): number {

        return reservas
            .filter(
                (reserva) =>
                    reserva.responsavelId ===
                        responsavelId &&
                    reserva.produtoId ===
                        produtoId &&
                    reserva.destinoId ===
                        destinoId &&
                    reserva.status ===
                        StatusReserva.ATIVA
            )
            .reduce(
                (total, reserva) =>
                    total +
                    this.quantidadeRestante(
                        reserva
                    ),
                0
            );
    }

    static quantidadeDisponivel(
        estoque: Estoque,
        reservas: Reserva[],
        produtoId: ProdutoId
    ): number {

        if (!estoque.responsavelId) {
            return 0;
        }

        const fisico =
            estoque.itens.find(
                (item) =>
                    item.produtoId ===
                    produtoId
            )?.quantidade ?? 0;

        const reservado =
            this.quantidadeReservada(
                reservas,
                produtoId,
                estoque.responsavelId
            );

        return Math.max(
            fisico -
            reservado,
            0
        );
    }

    static consumirReservasNoDestino(
        reservas: Reserva[],
        responsavelId: string,
        destinoId: DestinoReservaId,
        produtoId: ProdutoId,
        quantidade: number
    ): number {

        let restante =
            quantidade;

        let consumido =
            0;

        const reservasDestino =
            reservas.filter(
                (reserva) =>
                    reserva.responsavelId ===
                        responsavelId &&
                    reserva.destinoId ===
                        destinoId &&
                    reserva.produtoId ===
                        produtoId &&
                    reserva.status ===
                        StatusReserva.ATIVA
            );

        for (
            const reserva
            of reservasDestino
        ) {

            if (
                restante <= 0
            ) {
                break;
            }

            const disponivelReserva =
                this.quantidadeRestante(
                    reserva
                );

            const usar =
                Math.min(
                    disponivelReserva,
                    restante
                );

            if (
                usar <= 0
            ) {
                continue;
            }

            reserva.quantidadeUtilizada +=
                usar;

            restante -=
                usar;

            consumido +=
                usar;

            this.registrarEvento(
                reserva,
                TipoEventoReserva.UTILIZACAO,
                usar,
                "Quantidade utilizada em abastecimento"
            );

            if (
                this.quantidadeRestante(
                    reserva
                ) === 0
            ) {

                reserva.status =
                    StatusReserva.CONCLUIDA;

                this.registrarEvento(
                    reserva,
                    TipoEventoReserva.CONCLUSAO,
                    0,
                    "Reserva totalmente utilizada"
                );
            }
        }

        return consumido;
    }

    static liberarReservasNoDestino(
        reservas: Reserva[],
        responsavelId: string,
        destinoId: DestinoReservaId,
        produtoId: ProdutoId,
        quantidade: number
    ): number {

        if (
            quantidade <= 0
        ) {
            return 0;
        }

        let restante =
            quantidade;

        let liberado =
            0;

        const reservasDestino =
            reservas.filter(
                (reserva) =>
                    reserva.responsavelId ===
                        responsavelId &&
                    reserva.destinoId ===
                        destinoId &&
                    reserva.produtoId ===
                        produtoId &&
                    reserva.status ===
                        StatusReserva.ATIVA
            );

        for (
            const reserva
            of reservasDestino
        ) {

            if (
                restante <= 0
            ) {
                break;
            }

            const disponivelReserva =
                this.quantidadeRestante(
                    reserva
                );

            const liberar =
                Math.min(
                    disponivelReserva,
                    restante
                );

            if (
                liberar <= 0
            ) {
                continue;
            }

            reserva.quantidadeLiberada =
                this.quantidadeLiberada(
                    reserva
                ) +
                liberar;

            restante -=
                liberar;

            liberado +=
                liberar;

            this.registrarEvento(
                reserva,
                TipoEventoReserva.LIBERACAO,
                liberar,
                "Quantidade liberada da reserva"
            );

            if (
                this.quantidadeRestante(
                    reserva
                ) === 0
            ) {

                reserva.status =
                    StatusReserva.CANCELADA;
            }
        }

        return liberado;
    }

    static destinoReservaDoLocal(
        localId: LocalId
    ): DestinoReservaId {

        switch (localId) {

            case LocalId.BOULEVARD:
                return DestinoReservaId.BOULEVARD;

            case LocalId.AEROPORTO:
                return DestinoReservaId.AEROPORTO;

            case LocalId.SUPERMAGO_BOA_VISTA:
                return DestinoReservaId.SUPERMAGO_BOA_VISTA;

            case LocalId.GAUCHO_VICENTE_FONTOURA:
            case LocalId.SUPERMAGO_IPIRANGA:
            case LocalId.GAUCHO_ANTONIO_CARVALHO:
            case LocalId.SUPERMERCADO_FANTE:
            case LocalId.SUPERMAGO_PLANALTO:
            case LocalId.SAMS_CLUB:

                return DestinoReservaId.MERCADOS;

            default:

                throw new Error(
                    "Destino de reserva não configurado."
                );
        }
    }

    static listarDestinosPermitidos(
        responsavelId: string
    ): DestinoReservaId[] {

        if (
            responsavelId ===
            UsuarioId.RODRIGO
        ) {

            return [
                DestinoReservaId.BOULEVARD,
                DestinoReservaId.MERCADOS,
                DestinoReservaId.SUPERMAGO_BOA_VISTA
            ];
        }

        if (
            responsavelId ===
            UsuarioId.CESAR
        ) {

            return [
                DestinoReservaId.AEROPORTO,
                DestinoReservaId.MERCADOS,
                DestinoReservaId.SUPERMAGO_BOA_VISTA
            ];
        }

        return [];
    }

    static listarProdutosPermitidos(
        destinoId: DestinoReservaId
    ): ProdutoId[] {

        switch (destinoId) {

            case DestinoReservaId.BOULEVARD:

                return [
                    ProdutoId.MIX,
                    ProdutoId.PERSONAGENS,
                    ProdutoId.CAPIVARAS,
                    ProdutoId.BIG
                ];

            case DestinoReservaId.AEROPORTO:

                return [
                    ProdutoId.STITCH,
                    ProdutoId.CAPIVARAS,
                    ProdutoId.PERSONAGENS,
                    ProdutoId.BIG,
                    ProdutoId.MIX,
                    ProdutoId.LABUBU
                ];

            case DestinoReservaId.MERCADOS:

                return [
                    ProdutoId.MIX,
                    ProdutoId.CAPIVARAS
                ];

            case DestinoReservaId.SUPERMAGO_BOA_VISTA:

                return [
                    ProdutoId.BIG
                ];

            default:

                return [];
        }
    }

    static destinoPermitidoParaResponsavel(
        destinoId: DestinoReservaId,
        responsavelId: string
    ): boolean {

        return this
            .listarDestinosPermitidos(
                responsavelId
            )
            .includes(
                destinoId
            );
    }
}
