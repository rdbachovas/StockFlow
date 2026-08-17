import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";

import {
    DadosIniciais
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

import { AbastecimentoRemotoService } from "../services/AbastecimentoRemotoService";
import { ConsumoCarrinhoService } from "../services/ConsumoCarrinhoService";
import { DevolucaoEstoqueService } from "../services/DevolucaoEstoqueService";
import { MovimentoEstoquePrincipalService } from "../services/MovimentoEstoquePrincipalService";
import { PersistenceService } from "../services/PersistenceService";
import {
    EstadoSincronizacao,
    InicializacaoService
} from "../services/InicializacaoService";
import { ReservaRemotaService } from "../services/ReservaRemotaService";
import { RetiradaRemotaService } from "../services/RetiradaRemotaService";

interface AppContextValue {

    estadoSincronizacao: EstadoSincronizacao;

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
        ) => Promise<void>;

    registrarAbastecimento:
        (
            abastecimento: Abastecimento
        ) => Promise<void>;

    criarReserva:
        (
            reserva: Reserva
        ) => Promise<void>;

    cancelarReserva:
        (
            reservaId: string,
            responsavelId: string
        ) => Promise<void>;

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
    ] = useState<DadosIniciais | null>(
        null
    );

    const [
        hidratado,
        setHidratado
    ] = useState(false);

    const [
        estadoSincronizacao,
        setEstadoSincronizacao
    ] = useState<EstadoSincronizacao>("CARREGANDO");

    useEffect(
        () => {
            let ativo = true;

            const hidratar = async () => {
                const resultado =
                    await InicializacaoService
                        .carregar();

                if (!ativo) {
                    return;
                }

                setDados(resultado.dados);
                setEstadoSincronizacao(
                    resultado.estadoSincronizacao
                );
                setHidratado(true);
            };

            void hidratar();

            return () => {
                ativo = false;
            };
        },
        []
    );

    useEffect(
        () => {
            if (
                !hidratado ||
                !dados
            ) {
                return;
            }

            void PersistenceService
                .salvar(dados)
                .catch(
                    (erro: unknown) => {
                        console.error(
                            "Não foi possível salvar o estado.",
                            erro
                        );
                    }
                );
        },
        [
            dados,
            hidratado
        ]
    );

    const atualizarDados = (
        atualizador:
            (
                dadosAtuais: DadosIniciais
            ) => DadosIniciais
    ): void => {
        setDados(
            (dadosAtuais) => {
                if (!dadosAtuais) {
                    throw new Error(
                        "O estado ainda não foi carregado."
                    );
                }

                return atualizador(
                    dadosAtuais
                );
            }
        );
    };

    const registrarRetirada = (
        retirada: RetiradaEstoque
    ): Promise<void> => {
        return RetiradaRemotaService
            .registrar(
                retirada,
                estadoSincronizacao
            )
            .then((dadosOficiais) => {
                setDados(dadosOficiais);
                setEstadoSincronizacao("ONLINE");
            });
    };

    const registrarAbastecimento = (
        abastecimento: Abastecimento
    ): Promise<void> => {
        return AbastecimentoRemotoService
            .registrar(abastecimento, estadoSincronizacao)
            .then((dadosOficiais) => {
                setDados(dadosOficiais);
                setEstadoSincronizacao("ONLINE");
            });
    };

    const criarReserva = (
        reserva: Reserva
    ): Promise<void> => {
        return ReservaRemotaService
            .criar(reserva, estadoSincronizacao)
            .then((dadosOficiais) => {
                setDados(dadosOficiais);
                setEstadoSincronizacao("ONLINE");
            });
    };

    const cancelarReserva = (
        reservaId: string,
        responsavelId: string
    ): Promise<void> => {
        return ReservaRemotaService
            .cancelar(
                reservaId,
                responsavelId,
                estadoSincronizacao
            )
            .then((dadosOficiais) => {
                setDados(dadosOficiais);
                setEstadoSincronizacao("ONLINE");
            });
    };

    const registrarDevolucao = (
        devolucao: DevolucaoEstoque
    ): void => {

        atualizarDados((dadosAtuais) => {

        const principal =
            clonarEstoque(
                dadosAtuais.estoquePrincipal
            );

        const rodrigo =
            clonarEstoque(
                dadosAtuais.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dadosAtuais.estoqueCesar
            );

        const reservas =
            clonarReservas(
                dadosAtuais.reservas
            );

        const devolucoes = [
            ...dadosAtuais.devolucoes
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

        return {
            ...dadosAtuais,

            estoquePrincipal:
                principal,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            reservas,

            devolucoes
        };
        });
    };

    const registrarMovimentoEstoquePrincipal = (
        solicitacao:
            SolicitacaoMovimentoEstoquePrincipal
    ): void => {

        atualizarDados((dadosAtuais) => {

        const principal =
            clonarEstoque(
                dadosAtuais.estoquePrincipal
            );

        const movimentos = [
            ...dadosAtuais.movimentosEstoquePrincipal
        ];

        MovimentoEstoquePrincipalService.registrar(
            principal,
            movimentos,
            solicitacao
        );

        return {
            ...dadosAtuais,

            estoquePrincipal:
                principal,

            movimentosEstoquePrincipal:
                movimentos
        };
        });
    };

    const registrarConsumoCarrinho = (
        solicitacao:
            SolicitacaoConsumoCarrinho
    ): void => {

        atualizarDados((dadosAtuais) => {

        const rodrigo =
            clonarEstoque(
                dadosAtuais.estoqueRodrigo
            );

        const cesar =
            clonarEstoque(
                dadosAtuais.estoqueCesar
            );

        const consumos = [
            ...dadosAtuais.consumosCarrinho
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

        return {
            ...dadosAtuais,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            consumosCarrinho:
                consumos
        };
        });
    };

    if (
        !hidratado ||
        !dados
    ) {
        return null;
    }

    return (
        <AppContext.Provider
            value={{

                estadoSincronizacao,

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
