import React from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Abastecimento
} from "../models/Abastecimento";

import {
    LocalId
} from "../models/Local";

import {
    HistoricoAbastecimentoService
} from "../services/HistoricoAbastecimentoService";

interface Props {
    abastecimentos: Abastecimento[];
}

export function HistoricoScreen({
    abastecimentos
}: Props) {

    const historico =
        [...abastecimentos].sort(
            (a, b) =>
                b.data.getTime() -
                a.data.getTime()
        );

    const nomeLocal = (
        localId: LocalId
    ): string => {

        switch (localId) {

            case LocalId.BOULEVARD:
                return "Boulevard";

            case LocalId.AEROPORTO:
                return "Aeroporto";

            case LocalId.GAUCHO_VICENTE_FONTOURA:
                return "Gauchão Vicente da Fontoura";

            case LocalId.SUPERMAGO_IPIRANGA:
                return "SuperMago Ipiranga";

            case LocalId.GAUCHO_ANTONIO_CARVALHO:
                return "Gauchão Antônio de Carvalho";

            case LocalId.SUPERMERCADO_FANTE:
                return "Supermercado Fante";

            case LocalId.SUPERMAGO_PLANALTO:
                return "SuperMago Planalto";

            case LocalId.SAMS_CLUB:
                return "Sam's Club";

            case LocalId.SUPERMAGO_BOA_VISTA:
                return "SuperMago Boa Vista";

            default:
                return localId;
        }
    };

    if (historico.length === 0) {

        return (
            <SafeAreaView
                style={styles.container}
            >
                <View
                    style={styles.vazio}
                >

                    <Text
                        style={styles.vazioTitulo}
                    >
                        Nenhum abastecimento registrado
                    </Text>

                    <Text
                        style={styles.vazioTexto}
                    >
                        Os abastecimentos aparecerão aqui depois que forem confirmados.
                    </Text>

                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
        >

            <ScrollView
                contentContainerStyle={
                    styles.conteudo
                }
            >

                <Text
                    style={styles.titulo}
                >
                    Histórico
                </Text>

                <Text
                    style={styles.subtitulo}
                >
                    Abastecimentos realizados
                </Text>

                {
                    historico.map(
                        (abastecimento) => {

                            const resumoMaquinas =
                                HistoricoAbastecimentoService
                                    .resumirPorMaquina(
                                        abastecimento
                                    );

                            const total =
                                HistoricoAbastecimentoService
                                    .calcularTotal(
                                        abastecimento
                                    );

                            return (
                                <View
                                    key={
                                        abastecimento.id
                                    }
                                    style={
                                        styles.card
                                    }
                                >

                                    <View
                                        style={
                                            styles.cardTopo
                                        }
                                    >

                                        <View>
                                            <Text
                                                style={
                                                    styles.local
                                                }
                                            >
                                                {
                                                    nomeLocal(
                                                        abastecimento.localId
                                                    )
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.data
                                                }
                                            >
                                                {
                                                    abastecimento.data
                                                        .toLocaleString(
                                                            "pt-BR"
                                                        )
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.totalContainer
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.totalNumero
                                                }
                                            >
                                                {total}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.totalTexto
                                                }
                                            >
                                                pelúcias
                                            </Text>

                                        </View>

                                    </View>

                                    <View
                                        style={
                                            styles.divisor
                                        }
                                    />

                                    {
                                        resumoMaquinas.map(
                                            (maquina) => (

                                                <View
                                                    key={
                                                        maquina.maquinaId
                                                    }
                                                    style={
                                                        styles.maquina
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.maquinaNome
                                                        }
                                                    >
                                                        {
                                                            maquina.maquinaId
                                                        }
                                                    </Text>

                                                    <View
                                                        style={
                                                            styles.itens
                                                        }
                                                    >

                                                        {
                                                            maquina.itens.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (

                                                                    <Text
                                                                        key={
                                                                            `${item.maquinaId}-${item.produtoId}-${index}`
                                                                        }
                                                                        style={
                                                                            styles.itemTexto
                                                                        }
                                                                    >
                                                                        {
                                                                            item.produtoId
                                                                        }: {
                                                                            item.quantidade
                                                                        }
                                                                    </Text>

                                                                )
                                                            )
                                                        }

                                                    </View>

                                                </View>

                                            )
                                        )
                                    }

                                    <View
                                        style={
                                            styles.rodape
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.responsavel
                                            }
                                        >
                                            Responsável: {
                                                abastecimento.responsavelId
                                            }
                                        </Text>

                                        {
                                            abastecimento.observacao
                                                ? (
                                                    <Text
                                                        style={
                                                            styles.observacao
                                                        }
                                                    >
                                                        {
                                                            abastecimento.observacao
                                                        }
                                                    </Text>
                                                )
                                                : null
                                        }

                                    </View>

                                </View>
                            );
                        }
                    )
                }

            </ScrollView>

        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor: "#F5F5F5"
        },

        conteudo: {
            padding: 20,
            paddingBottom: 50
        },

        titulo: {
            fontSize: 30,
            fontWeight: "800"
        },

        subtitulo: {
            fontSize: 16,
            color: "#666666",
            marginTop: 4,
            marginBottom: 24
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 18,
            marginBottom: 16
        },

        cardTopo: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
        },

        local: {
            fontSize: 20,
            fontWeight: "700"
        },

        data: {
            fontSize: 14,
            color: "#666666",
            marginTop: 4
        },

        totalContainer: {
            alignItems: "center"
        },

        totalNumero: {
            fontSize: 24,
            fontWeight: "800"
        },

        totalTexto: {
            fontSize: 12,
            color: "#666666"
        },

        divisor: {
            height: 1,
            backgroundColor: "#E5E5E5",
            marginVertical: 16
        },

        maquina: {
            marginBottom: 14
        },

        maquinaNome: {
            fontSize: 17,
            fontWeight: "700",
            marginBottom: 4
        },

        itens: {
            paddingLeft: 8
        },

        itemTexto: {
            fontSize: 15,
            marginBottom: 3
        },

        rodape: {
            borderTopWidth: 1,
            borderTopColor: "#E5E5E5",
            paddingTop: 12,
            marginTop: 4
        },

        responsavel: {
            fontSize: 13,
            color: "#666666"
        },

        observacao: {
            fontSize: 14,
            marginTop: 6
        },

        vazio: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 30
        },

        vazioTitulo: {
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center"
        },

        vazioTexto: {
            fontSize: 15,
            color: "#666666",
            textAlign: "center",
            marginTop: 8
        }
    });
