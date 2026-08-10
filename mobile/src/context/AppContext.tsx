import React, {
    createContext,
    ReactNode,
    useContext,
    useState
} from "react";

import {
    criarDadosIniciais
} from "../data/AppData";

import { Abastecimento } from "../models/Abastecimento";

import {
    ConsumoCarrinho,
    SolicitacaoConsumoCarrinho
} from "../models/ConsumoCarrinho";

import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";

import {
    MovimentoEstoquePrincipal,
    SolicitacaoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";

import { Reserva } from "../models/Reserva";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";

import { AbastecimentoService } from "../services/AbastecimentoService";
import { ConsumoCarrinhoService } from "../services/ConsumoCarrinhoService";
import { DevolucaoEstoqueService } from "../services/DevolucaoEstoqueService";
import { MovimentoEstoquePrincipalService } from "../services/MovimentoEstoquePrincipalService";
import { ReservaService } from "../services/ReservaService";
import { RetiradaEstoqueService } from "../services/RetiradaEstoqueService";

interface AppContextValue {

    estoquePrincipal: Estoque;

    estoqueRodrigo: Estoque;

    estoqueCesar: Estoque;

    reservas: Reserva[];

    abastecimentos: Abastecimento[];

    retiradas: RetiradaEstoque[];

    devolucoes: DevolucaoEstoque[];

    movimentosEstoquePrincipal:
        MovimentoEstoquePrincipal[];

    consumosCarrinho:
        ConsumoCarrinho[];

    registrarRetirada:
        (
            retirada: RetiradaEstoque
        ) => void;

    registrarAbastecimento:
        (
            abastecimento: Abastecimento
        ) => void;

    criarReserva:
        (
            reserva: Reserva
        ) => void;

    cancelarReserva:
        (
            reservaId: string,
            responsavelId: string
        ) => void;

    registrarDevolucao:
        (
            devolucao: DevolucaoEstoque
        ) => void;

    registrarMovimentoEstoquePrincipal:
        (
            solicitacao:
                SolicitacaoMovimentoEstoquePrincipal
        ) => void;

    registrarConsumoCarrinho:
        (
            solicitacao:
                SolicitacaoConsumoCarrinho
        ) => void;
}

const AppContext =
    createContext<
        AppContextValue | undefined
    >(undefined);

interface Props {
    children: ReactNode;
}

function clonarEstoque(
    estoque: Estoque
): Estoque {

    return {
        ...estoque,

        itens:
            estoque.itens.map(
                (item) => ({
                    ...item
                })
            )
    };
}

function clonarReservas(
    reservas: Reserva[]
): Reserva[] {

    return reservas.map(
        (reserva) => ({
            ...reserva,

            historico:
                reserva.historico?.map(
                    (evento) => ({
                        ...evento
                    })
                )
        })
    );
}

export function AppProvider({
    children
}: Props) {

    const [
        dados,
        setDados
    ] = useState(
        criarDadosIniciais
    );

    const registrarRetirada = (
        retirada: RetiradaEstoque
    ): void => {

        const principal =
            clonarEstoque(
                dados.estoquePrincipal
            );

        const rodrigo =
            clonarEstoque(
                dados.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dados.estoqueCesar
            );

        const retiradas = [
            ...dados.retiradas
        ];

        const destino =
            retirada.responsavelId ===
                UsuarioId.RODRIGO
                ? rodrigo
                : retirada.responsavelId ===
                    UsuarioId.CESAR
                    ? cesar
                    : undefined;

        if (!destino) {
            throw new Error(
                "Responsável inválido."
            );
        }

        RetiradaEstoqueService.registrar(
            principal,
            destino,
            retiradas,
            retirada
        );

        setDados({
            ...dados,

            estoquePrincipal:
                principal,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            retiradas
        });
    };

    const registrarAbastecimento = (
        abastecimento: Abastecimento
    ): void => {

        const rodrigo =
            clonarEstoque(
                dados.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dados.estoqueCesar
            );

        const reservas =
            clonarReservas(
                dados.reservas
            );

        const abastecimentos = [
            ...dados.abastecimentos
        ];

        const estoque =
            abastecimento.responsavelId ===
                UsuarioId.RODRIGO
                ? rodrigo
                : abastecimento.responsavelId ===
                    UsuarioId.CESAR
                    ? cesar
                    : undefined;

        if (!estoque) {
            throw new Error(
                "Responsável inválido."
            );
        }

        AbastecimentoService.registrar(
            estoque,
            reservas,
            abastecimentos,
            abastecimento
        );

        setDados({
            ...dados,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            reservas,

            abastecimentos
        });
    };

    const criarReserva = (
        reserva: Reserva
    ): void => {

        const reservas =
            clonarReservas(
                dados.reservas
            );

        const estoque =
            reserva.responsavelId ===
                UsuarioId.RODRIGO
                ? dados.estoqueRodrigo
                : reserva.responsavelId ===
                    UsuarioId.CESAR
                    ? dados.estoqueCesar
                    : undefined;

        if (!estoque) {
            throw new Error(
                "Responsável inválido."
            );
        }

        ReservaService.criarReserva(
            estoque,
            reservas,
            reserva
        );

        setDados({
            ...dados,
            reservas
        });
    };

    const cancelarReserva = (
        reservaId: string,
        responsavelId: string
    ): void => {

        const reservas =
            clonarReservas(
                dados.reservas
            );

        ReservaService.cancelarReserva(
            reservas,
            reservaId,
            responsavelId
        );

        setDados({
            ...dados,
            reservas
        });
    };

    const registrarDevolucao = (
        devolucao: DevolucaoEstoque
    ): void => {

        const principal =
            clonarEstoque(
                dados.estoquePrincipal
            );

        const rodrigo =
            clonarEstoque(
                dados.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dados.estoqueCesar
            );

        const reservas =
            clonarReservas(
                dados.reservas
            );

        const devolucoes = [
            ...dados.devolucoes
        ];

        const estoquePessoal =
            devolucao.responsavelId ===
                UsuarioId.RODRIGO
                ? rodrigo
                : devolucao.responsavelId ===
                    UsuarioId.CESAR
                    ? cesar
                    : undefined;

        if (!estoquePessoal) {
            throw new Error(
                "Responsável inválido."
            );
        }

        DevolucaoEstoqueService.registrar(
            estoquePessoal,
            principal,
            reservas,
            devolucoes,
            devolucao
        );

        setDados({
            ...dados,

            estoquePrincipal:
                principal,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            reservas,

            devolucoes
        });
    };

    const registrarMovimentoEstoquePrincipal = (
        solicitacao:
            SolicitacaoMovimentoEstoquePrincipal
    ): void => {

        const principal =
            clonarEstoque(
                dados.estoquePrincipal
            );

        const movimentos = [
            ...dados.movimentosEstoquePrincipal
        ];

        MovimentoEstoquePrincipalService.registrar(
            principal,
            movimentos,
            solicitacao
        );

        setDados({
            ...dados,

            estoquePrincipal:
                principal,

            movimentosEstoquePrincipal:
                movimentos
        });
    };

    const registrarConsumoCarrinho = (
        solicitacao:
            SolicitacaoConsumoCarrinho
    ): void => {

        const rodrigo =
            clonarEstoque(
                dados.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dados.estoqueCesar
            );

        const consumos = [
            ...dados.consumosCarrinho
        ];

        const estoque =
            solicitacao.responsavelId ===
                UsuarioId.RODRIGO
                ? rodrigo
                : solicitacao.responsavelId ===
                    UsuarioId.CESAR
                    ? cesar
                    : undefined;

        if (!estoque) {

            throw new Error(
                "Responsável inválido."
            );
        }

        ConsumoCarrinhoService.registrar(
            estoque,
            consumos,
            solicitacao
        );

        setDados({
            ...dados,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            consumosCarrinho:
                consumos
        });
    };

    return (
        <AppContext.Provider
            value={{

                estoquePrincipal:
                    dados.estoquePrincipal,

                estoqueRodrigo:
                    dados.estoqueRodrigo,

                estoqueCesar:
                    dados.estoqueCesar,

                reservas:
                    dados.reservas,

                abastecimentos:
                    dados.abastecimentos,

                retiradas:
                    dados.retiradas,

                devolucoes:
                    dados.devolucoes,

                movimentosEstoquePrincipal:
                    dados.movimentosEstoquePrincipal,

                consumosCarrinho:
                    dados.consumosCarrinho,

                registrarRetirada,

                registrarAbastecimento,

                criarReserva,

                cancelarReserva,

                registrarDevolucao,

                registrarMovimentoEstoquePrincipal,

                registrarConsumoCarrinho
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp():
    AppContextValue {

    const contexto =
        useContext(
            AppContext
        );

    if (!contexto) {

        throw new Error(
            "useApp deve ser utilizado dentro de AppProvider."
        );
    }

    return contexto;
}
