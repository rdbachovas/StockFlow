import React from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import {
    Link
} from "expo-router";

import {
    LocalId
} from "../models/Local";

interface Mercado {
    localId: LocalId;
    nome: string;
    descricao: string;
}

const mercados: Mercado[] = [

    {
        localId:
            LocalId.GAUCHO_VICENTE_FONTOURA,

        nome:
            "Gauchão Vicente da Fontoura",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.SUPERMAGO_IPIRANGA,

        nome:
            "SuperMago Ipiranga",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.GAUCHO_ANTONIO_CARVALHO,

        nome:
            "Gauchão Antônio de Carvalho",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.SUPERMERCADO_FANTE,

        nome:
            "Supermercado Fante",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.SUPERMAGO_PLANALTO,

        nome:
            "SuperMago Planalto",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.SAMS_CLUB,

        nome:
            "Sam's Club",

        descricao:
            "MIX + CAPIVARAS"
    },

    {
        localId:
            LocalId.SUPERMAGO_BOA_VISTA,

        nome:
            "SuperMago Boa Vista",

        descricao:
            "BIG"
    }
];

export function HomeScreen() {

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
                    StockFlow
                </Text>

                <Text
                    style={styles.subtitulo}
                >
                    Controle de estoque e abastecimentos
                </Text>

                <Text
                    style={styles.secaoTitulo}
                >
                    Abastecer
                </Text>

                <Link
                    href={{
                        pathname:
                            "/abastecimento",

                        params: {
                            localId:
                                LocalId.BOULEVARD
                        }
                    }}
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Boulevard
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                M1, M2, M3, M4 e M5
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

                <Link
                    href={{
                        pathname:
                            "/abastecimento",

                        params: {
                            localId:
                                LocalId.AEROPORTO
                        }
                    }}
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Aeroporto
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                B01, B02, B03, Grandes, B06 e B07
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.secaoSeparada
                    ]}
                >
                    Mercados
                </Text>

                <Text
                    style={styles.secaoDescricao}
                >
                    Rodrigo ou Cesar podem realizar o abastecimento
                </Text>

                {
                    mercados.map(
                        (mercado) => (

                            <Link
                                key={
                                    mercado.localId
                                }

                                href={{
                                    pathname:
                                        "/abastecimento",

                                    params: {
                                        localId:
                                            mercado.localId
                                    }
                                }}

                                asChild
                            >
                                <TouchableOpacity
                                    style={styles.card}
                                >
                                    <View
                                        style={styles.cardConteudo}
                                    >
                                        <Text
                                            style={styles.cardTituloMercado}
                                        >
                                            {mercado.nome}
                                        </Text>

                                        <Text
                                            style={styles.cardDescricao}
                                        >
                                            {mercado.descricao}
                                        </Text>
                                    </View>

                                    <Text
                                        style={styles.seta}
                                    >
                                        ›
                                    </Text>
                                </TouchableOpacity>
                            </Link>

                        )
                    )
                }

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.secaoSeparada
                    ]}
                >
                    Planejamento
                </Text>

                <Link
                    href="/reservas"
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Reservas
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                Separe estoque para abastecimentos futuros
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.secaoSeparada
                    ]}
                >
                    Estoques
                </Text>

                <Link
                    href="/estoque-principal"
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Estoque Principal
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                Consulte e retire produtos
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

                <Link
                    href="/estoque-pessoal"
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Estoque pessoal
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                Veja o estoque de Rodrigo e Cesar
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.secaoSeparada
                    ]}
                >
                    Consultar
                </Text>

                <Link
                    href="/historico-estoque-pessoal"
                    asChild
                >

                    <TouchableOpacity
                        style={styles.card}
                    >

                        <View
                            style={styles.cardConteudo}
                        >

                            <Text
                                style={styles.cardTitulo}
                            >
                                Movimentações do estoque
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                Entradas e saídas dos estoques pessoais
                            </Text>

                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>

                    </TouchableOpacity>

                </Link>


                <Link
                    href="/historico"
                    asChild
                >
                    <TouchableOpacity
                        style={styles.card}
                    >
                        <View
                            style={styles.cardConteudo}
                        >
                            <Text
                                style={styles.cardTitulo}
                            >
                                Histórico
                            </Text>

                            <Text
                                style={styles.cardDescricao}
                            >
                                Veja os abastecimentos realizados
                            </Text>
                        </View>

                        <Text
                            style={styles.seta}
                        >
                            ›
                        </Text>
                    </TouchableOpacity>
                </Link>

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
            paddingTop: 30,
            paddingBottom: 60
        },

        titulo: {
            fontSize: 32,
            fontWeight: "800"
        },

        subtitulo: {
            fontSize: 16,
            marginTop: 4,
            marginBottom: 32,
            color: "#666666"
        },

        secaoTitulo: {
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 14
        },

        secaoSeparada: {
            marginTop: 24
        },

        secaoDescricao: {
            color: "#666666",
            fontSize: 14,
            marginTop: -7,
            marginBottom: 14
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,

            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
        },

        cardConteudo: {
            flex: 1,
            paddingRight: 12
        },

        cardTitulo: {
            fontSize: 20,
            fontWeight: "700"
        },

        cardTituloMercado: {
            fontSize: 17,
            fontWeight: "700"
        },

        cardDescricao: {
            fontSize: 14,
            color: "#666666",
            marginTop: 5
        },

        seta: {
            fontSize: 34,
            fontWeight: "300"
        }
    });
