import React, {
    useMemo,
    useState
} from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import {
    Abastecimento
} from "../models/Abastecimento";

import {
    ConsumoCarrinho
} from "../models/ConsumoCarrinho";

import {
    DevolucaoEstoque
} from "../models/DevolucaoEstoque";

import {
    LocalId
} from "../models/Local";

import {
    ProdutoId
} from "../models/Produto";

import {
    RetiradaEstoque
} from "../models/RetiradaEstoque";

import {
    UsuarioId
} from "../models/Usuario";

import {
    nomeProduto
} from "../utils/ProdutoUtils";

interface Props {
    retiradas: RetiradaEstoque[];
    abastecimentos: Abastecimento[];
    devolucoes: DevolucaoEstoque[];
    consumosCarrinho: ConsumoCarrinho[];
}

interface ItemHistorico {
    produtoId: ProdutoId;
    quantidade: number;
}

type TipoHistorico =
    | "ENTRADA"
    | "ABASTECIMENTO"
    | "DEVOLUCAO"
    | "CONSUMO_CARRINHO";

interface MovimentoHistorico {
    id: string;

    tipo: TipoHistorico;

    responsavelId: string;

    data: Date;

    titulo: string;

    descricao: string;

    itens: ItemHistorico[];

    total: number;
}

function nomeLocal(
    localId: LocalId
): string {

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
            return String(localId);
    }
}

function nomeResponsavel(
    responsavelId: string
): string {

    return responsavelId ===
        UsuarioId.RODRIGO
        ? "Rodrigo"
        : responsavelId ===
            UsuarioId.CESAR
            ? "Cesar"
            : responsavelId;
}

function agruparItens(
    itens: ItemHistorico[]
): ItemHistorico[] {

    const mapa =
        new Map<
            ProdutoId,
            number
        >();

    for (
        const item
        of itens
    ) {

        mapa.set(
            item.produtoId,

            (
                mapa.get(
                    item.produtoId
                ) ?? 0
            ) +
            item.quantidade
        );
    }

    return Array.from(
        mapa.entries()
    ).map(
        (
            [
                produtoId,
                quantidade
            ]
        ) => ({
            produtoId,
            quantidade
        })
    );
}

export function HistoricoEstoquePessoalScreen({
    retiradas,
    abastecimentos,
    devolucoes,
    consumosCarrinho
}: Props) {

    const [
        filtroResponsavel,
        setFiltroResponsavel
    ] = useState<
        UsuarioId | "TODOS"
    >("TODOS");

    const movimentos =
        useMemo(
            (): MovimentoHistorico[] => {

                const resultado:
                    MovimentoHistorico[] = [];

                for (
                    const retirada
                    of retiradas
                ) {

                    const itens =
                        retirada.itens.map(
                            (item) => ({
                                produtoId:
                                    item.produtoId,

                                quantidade:
                                    item.quantidade
                            })
                        );

                    resultado.push({

                        id:
                            `RET_${retirada.id}`,

                        tipo:
                            "ENTRADA",

                        responsavelId:
                            retirada.responsavelId,

                        data:
                            retirada.data,

                        titulo:
                            "Entrada no estoque pessoal",

                        descricao:
                            `Estoque Principal → ${nomeResponsavel(
                                retirada.responsavelId
                            )}`,

                        itens,

                        total:
                            itens.reduce(
                                (soma, item) =>
                                    soma +
                                    item.quantidade,
                                0
                            )
                    });
                }

                for (
                    const abastecimento
                    of abastecimentos
                ) {

                    const itens =
                        agruparItens(
                            abastecimento.itens.map(
                                (item) => ({
                                    produtoId:
                                        item.produtoId,

                                    quantidade:
                                        item.quantidade
                                })
                            )
                        );

                    resultado.push({

                        id:
                            `ABA_${abastecimento.id}`,

                        tipo:
                            "ABASTECIMENTO",

                        responsavelId:
                            abastecimento.responsavelId,

                        data:
                            abastecimento.data,

                        titulo:
                            "Saída para abastecimento",

                        descricao:
                            `${nomeResponsavel(
                                abastecimento.responsavelId
                            )} → ${nomeLocal(
                                abastecimento.localId
                            )}`,

                        itens,

                        total:
                            itens.reduce(
                                (soma, item) =>
                                    soma +
                                    item.quantidade,
                                0
                            )
                    });
                }

                for (
                    const devolucao
                    of devolucoes
                ) {

                    const itens =
                        devolucao.itens.map(
                            (item) => {

                                const reservado =
                                    item.reservas.reduce(
                                        (
                                            soma,
                                            parcela
                                        ) =>
                                            soma +
                                            parcela.quantidade,
                                        0
                                    );

                                return {
                                    produtoId:
                                        item.produtoId,

                                    quantidade:
                                        item.quantidadeLivre +
                                        reservado
                                };
                            }
                        );

                    resultado.push({

                        id:
                            `DEV_${devolucao.id}`,

                        tipo:
                            "DEVOLUCAO",

                        responsavelId:
                            devolucao.responsavelId,

                        data:
                            devolucao.data,

                        titulo:
                            "Devolução ao estoque principal",

                        descricao:
                            `${nomeResponsavel(
                                devolucao.responsavelId
                            )} → Estoque Principal`,

                        itens,

                        total:
                            itens.reduce(
                                (soma, item) =>
                                    soma +
                                    item.quantidade,
                                0
                            )
                    });
                }

                for (
                    const consumo
                    of consumosCarrinho
                ) {

                    const itens =
                        consumo.itens.map(
                            (item) => ({
                                produtoId:
                                    item.produtoId,

                                quantidade:
                                    item.quantidade
                            })
                        );

                    resultado.push({

                        id:
                            `CONS_${consumo.id}`,

                        tipo:
                            "CONSUMO_CARRINHO",

                        responsavelId:
                            consumo.responsavelId,

                        data:
                            consumo.data,

                        titulo:
                            "Consumo do carrinho de pipoca",

                        descricao:
                            `${nomeResponsavel(
                                consumo.responsavelId
                            )} → Carrinho de Pipoca`,

                        itens,

                        total:
                            itens.reduce(
                                (soma, item) =>
                                    soma +
                                    item.quantidade,
                                0
                            )
                    });
                }

                return resultado.sort(
                    (a, b) =>
                        new Date(
                            b.data
                        ).getTime() -
                        new Date(
                            a.data
                        ).getTime()
                );
            },
            [
                retiradas,
                abastecimentos,
                devolucoes,
                consumosCarrinho
            ]
        );

    const filtrados =
        filtroResponsavel ===
        "TODOS"
            ? movimentos
            : movimentos.filter(
                (movimento) =>
                    movimento.responsavelId ===
                    filtroResponsavel
            );

    const positivo = (
        tipo: TipoHistorico
    ): boolean => {

        return tipo ===
            "ENTRADA";
    };

    const textoTipo = (
        tipo: TipoHistorico
    ): string => {

        switch (tipo) {

            case "ENTRADA":
                return "ENTRADA";

            case "ABASTECIMENTO":
                return "ABASTECIMENTO";

            case "DEVOLUCAO":
                return "DEVOLUÇÃO";

            case "CONSUMO_CARRINHO":
                return "CONSUMO DO CARRINHO";
        }
    };

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
                    Histórico do estoque pessoal
                </Text>

                <Text
                    style={styles.subtitulo}
                >
                    Controle de todas as entradas e saídas físicas
                </Text>

                <View
                    style={styles.filtros}
                >

                    {
                        [
                            ["TODOS", "Todos"],
                            [
                                UsuarioId.RODRIGO,
                                "Rodrigo"
                            ],
                            [
                                UsuarioId.CESAR,
                                "Cesar"
                            ]
                        ].map(
                            ([valor, nome]) => (

                                <TouchableOpacity
                                    key={
                                        valor
                                    }
                                    style={[
                                        styles.filtro,

                                        filtroResponsavel ===
                                            valor &&
                                        styles.filtroAtivo
                                    ]}
                                    onPress={
                                        () =>
                                            setFiltroResponsavel(
                                                valor as
                                                    UsuarioId |
                                                    "TODOS"
                                            )
                                    }
                                >

                                    <Text
                                        style={[
                                            styles.filtroTexto,

                                            filtroResponsavel ===
                                                valor &&
                                            styles.filtroTextoAtivo
                                        ]}
                                    >
                                        {nome}
                                    </Text>

                                </TouchableOpacity>
                            )
                        )
                    }

                </View>

                {
                    filtrados.length ===
                    0
                        ? (
                            <View
                                style={styles.vazio}
                            >
                                <Text>
                                    Nenhuma movimentação.
                                </Text>
                            </View>
                        )
                        : filtrados.map(
                            (movimento) => {

                                const sinal =
                                    positivo(
                                        movimento.tipo
                                    )
                                        ? "+"
                                        : "-";

                                return (
                                    <View
                                        key={
                                            movimento.id
                                        }
                                        style={
                                            styles.card
                                        }
                                    >

                                        <View
                                            style={
                                                styles.topo
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.topoInfo
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.tipo
                                                    }
                                                >
                                                    {
                                                        textoTipo(
                                                            movimento.tipo
                                                        )
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.cardTitulo
                                                    }
                                                >
                                                    {
                                                        movimento.titulo
                                                    }
                                                </Text>

                                            </View>

                                            <Text
                                                style={
                                                    styles.total
                                                }
                                            >
                                                {sinal}{
                                                    movimento.total
                                                }
                                            </Text>

                                        </View>

                                        <Text
                                            style={
                                                styles.descricao
                                            }
                                        >
                                            {
                                                movimento.descricao
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.data
                                            }
                                        >
                                            {
                                                new Date(
                                                    movimento.data
                                                ).toLocaleString(
                                                    "pt-BR"
                                                )
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.itens
                                            }
                                        >

                                            {
                                                movimento.itens.map(
                                                    (item) => (

                                                        <View
                                                            key={
                                                                item.produtoId
                                                            }
                                                            style={
                                                                styles.item
                                                            }
                                                        >

                                                            <Text>
                                                                {
                                                                    nomeProduto(
                                                                        item.produtoId
                                                                    )
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.itemQuantidade
                                                                }
                                                            >
                                                                {sinal}{
                                                                    item.quantidade
                                                                }
                                                            </Text>

                                                        </View>
                                                    )
                                                )
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
            paddingBottom: 60
        },

        titulo: {
            fontSize: 28,
            fontWeight: "800"
        },

        subtitulo: {
            color: "#666666",
            marginTop: 4,
            marginBottom: 20
        },

        filtros: {
            flexDirection: "row",
            gap: 8,
            marginBottom: 20
        },

        filtro: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 10,
            padding: 10,
            alignItems: "center"
        },

        filtroAtivo: {
            backgroundColor: "#111111",
            borderColor: "#111111"
        },

        filtroTexto: {
            fontWeight: "700"
        },

        filtroTextoAtivo: {
            color: "#FFFFFF"
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 12
        },

        topo: {
            flexDirection: "row",
            justifyContent: "space-between"
        },

        topoInfo: {
            flex: 1
        },

        tipo: {
            fontSize: 11,
            fontWeight: "800",
            color: "#777777"
        },

        cardTitulo: {
            fontSize: 17,
            fontWeight: "800",
            marginTop: 3
        },

        total: {
            fontSize: 23,
            fontWeight: "800"
        },

        descricao: {
            marginTop: 8,
            fontWeight: "600"
        },

        data: {
            color: "#777777",
            fontSize: 12,
            marginTop: 4
        },

        itens: {
            borderTopWidth: 1,
            borderTopColor: "#EEEEEE",
            marginTop: 12,
            paddingTop: 10
        },

        item: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 7
        },

        itemQuantidade: {
            fontWeight: "800"
        },

        vazio: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 20,
            alignItems: "center"
        }
    });
