import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    criarDadosIniciais,
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

import { AbastecimentoService } from "../services/AbastecimentoService";
import { ConsumoCarrinhoService } from "../services/ConsumoCarrinhoService";
import { DevolucaoEstoqueService } from "../services/DevolucaoEstoqueService";
import { MovimentoEstoquePrincipalService } from "../services/MovimentoEstoquePrincipalService";
import { PersistenceService } from "../services/PersistenceService";
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
    ] = useState<DadosIniciais | null>(
        null
    );

    const [
        hidratado,
        setHidratado
    ] = useState(false);

    const [
        erroHidratacao,
        setErroHidratacao
    ] = useState<string | null>(null);

    useEffect(
        () => {
            let ativo = true;

            const hidratar = async () => {
                const resultado =
                    await PersistenceService
                        .carregar();

                if (!ativo) {
                    return;
                }

                if (
                    resultado.tipo ===
                    "VALIDO"
                ) {
                    setDados(resultado.dados);
                } else if (
                    resultado.tipo ===
                    "AUSENTE"
                ) {
                    setDados(
                        criarDadosIniciais()
                    );
                } else {
                    setErroHidratacao(
                        resultado.motivo
                    );
                }

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
                !dados ||
                erroHidratacao
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
            erroHidratacao,
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

        const retiradas = [
            ...dadosAtuais.retiradas
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

        return {
            ...dadosAtuais,

            estoquePrincipal:
                principal,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            retiradas
        };
        });
    };

    const registrarAbastecimento = (
        abastecimento: Abastecimento
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

        const reservas =
            clonarReservas(
                dadosAtuais.reservas
            );

        const abastecimentos = [
            ...dadosAtuais.abastecimentos
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

        return {
            ...dadosAtuais,

            estoqueRodrigo:
                rodrigo,

            estoqueCesar:
                cesar,

            reservas,

            abastecimentos
        };
        });
    };

    const criarReserva = (
        reserva: Reserva
    ): void => {

        atualizarDados((dadosAtuais) => {

        const reservas =
            clonarReservas(
                dadosAtuais.reservas
            );

        const estoque =
            reserva.responsavelId ===
                UsuarioId.RODRIGO
                ? dadosAtuais.estoqueRodrigo
                : reserva.responsavelId ===
                    UsuarioId.CESAR
                    ? dadosAtuais.estoqueCesar
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

        return {
            ...dadosAtuais,
            reservas
        };
        });
    };

    const cancelarReserva = (
        reservaId: string,
        responsavelId: string
    ): void => {

        atualizarDados((dadosAtuais) => {

        const reservas =
            clonarReservas(
                dadosAtuais.reservas
            );

        ReservaService.cancelarReserva(
            reservas,
            reservaId,
            responsavelId
        );

        return {
            ...dadosAtuais,
            reservas
        };
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
        (!dados && !erroHidratacao)
    ) {
        return null;
    }

    if (
        erroHidratacao ||
        !dados
    ) {
        return (
            <View style={styles.erroContainer}>
                <Text style={styles.erroTitulo}>
                    Não foi possível carregar os dados
                </Text>

                <Text style={styles.erroTexto}>
                    {erroHidratacao}
                </Text>
            </View>
        );
    }

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

const styles = StyleSheet.create({
    erroContainer: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 24
    },

    erroTitulo: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "center"
    },

    erroTexto: {
        fontSize: 14,
        textAlign: "center"
    }
});
