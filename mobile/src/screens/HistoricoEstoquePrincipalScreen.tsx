import React, {
    useMemo,
    useState
} from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";

import {
    MovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";

import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";

import {
    nomeProduto
} from "../utils/ProdutoUtils";

type TipoEventoPrincipal =
    | "ENTRADA"
    | "AJUSTE_SAIDA"
    | "RETIRADA_PESSOAL"
    | "DEVOLUCAO";

interface ItemEvento {
    produtoId: ProdutoId;
    quantidade: number;
    delta: number;

    saldoAnterior?: number;
    saldoPosterior?: number;
}

interface EventoPrincipal {
    id: string;

    tipo: TipoEventoPrincipal;

    responsavelId: string;

    data: Date;

    titulo: string;

    descricao: string;

    itens: ItemEvento[];

    observacao?: string;
}

interface Props {

    estoquePrincipal: Estoque;

    movimentos:
        MovimentoEstoquePrincipal[];

    retiradas:
        RetiradaEstoque[];

    devolucoes:
        DevolucaoEstoque[];
}

function nomeResponsavel(
    responsavelId: string
): string {

    if (
        responsavelId ===
        UsuarioId.RODRIGO
    ) {
        return "Rodrigo";
    }

    if (
        responsavelId ===
        UsuarioId.CESAR
    ) {
        return "Cesar";
    }

    return responsavelId;
}

function textoTipo(
    tipo: TipoEventoPrincipal
): string {

    switch (tipo) {

        case "ENTRADA":
            return "ENTRADA";

        case "AJUSTE_SAIDA":
            return "AJUSTE / REMOÇÃO";

        case "RETIRADA_PESSOAL":
            return "RETIRADA";

        case "DEVOLUCAO":
            return "DEVOLUÇÃO";
    }
}

export function HistoricoEstoquePrincipalScreen({
    estoquePrincipal,
    movimentos,
    retiradas,
    devolucoes
}: Props) {

    const [
        filtro,
        setFiltro
    ] = useState<
        "TODOS" |
        "ENTRADAS" |
        "SAIDAS"
    >("TODOS");

    const eventos =
        useMemo(
            () => {

                const lista:
                    EventoPrincipal[] = [];

                for (
                    const movimento
                    of movimentos
                ) {

                    const entrada =
                        movimento.tipo ===
                        TipoMovimentoEstoquePrincipal.ENTRADA;

                    lista.push({

                        id:
                            `MOV_${movimento.id}`,

                        tipo:
                            entrada
                                ? "ENTRADA"
                                : "AJUSTE_SAIDA",

                        responsavelId:
                            movimento.responsavelId,

                        data:
                            movimento.data,

                        titulo:
                            entrada
                                ? "Entrada no Estoque Principal"
                                : "Saída / ajuste do Estoque Principal",

                        descricao:
                            entrada
                                ? "Mercadoria adicionada ao estoque central"
                                : "Remoção direta do estoque central",

                        observacao:
                            movimento.observacao,

                        itens:
                            movimento.itens.map(
                                (item) => ({

                                    produtoId:
                                        item.produtoId,

                                    quantidade:
                                        item.quantidade,

                                    delta:
                                        entrada
                                            ? item.quantidade
                                            : -item.quantidade
                                })
                            )
                    });
                }

                for (
                    const retirada
                    of retiradas
                ) {

                    lista.push({

                        id:
                            `RET_${retirada.id}`,

                        tipo:
                            "RETIRADA_PESSOAL",

                        responsavelId:
                            retirada.responsavelId,

                        data:
                            retirada.data,

                        titulo:
                            "Transferência para estoque pessoal",

                        descricao:
                            `Estoque Principal → ${nomeResponsavel(
                                retirada.responsavelId
                            )}`,

                        observacao:
                            retirada.observacao,

                        itens:
                            retirada.itens.map(
                                (item) => ({

                                    produtoId:
                                        item.produtoId,

                                    quantidade:
                                        item.quantidade,

                                    delta:
                                        -item.quantidade
                                })
                            )
                    });
                }

                for (
                    const devolucao
                    of devolucoes
                ) {

                    lista.push({

                        id:
                            `DEV_${devolucao.id}`,

                        tipo:
                            "DEVOLUCAO",

                        responsavelId:
                            devolucao.responsavelId,

                        data:
                            devolucao.data,

                        titulo:
                            "Devolução ao Estoque Principal",

                        descricao:
                            `${nomeResponsavel(
                                devolucao.responsavelId
                            )} → Estoque Principal`,

                        observacao:
                            devolucao.observacao,

                        itens:
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

                                    const quantidade =
                                        item.quantidadeLivre +
                                        reservado;

                                    return {
                                        produtoId:
                                            item.produtoId,

                                        quantidade,

                                        delta:
                                            quantidade
                                    };
                                }
                            )
                    });
                }

                const deltasTotais =
                    new Map<
                        ProdutoId,
                        number
                    >();

                for (
                    const evento
                    of lista
                ) {

                    for (
                        const item
                        of evento.itens
                    ) {

                        const atual =
                            deltasTotais.get(
                                item.produtoId
                            ) ?? 0;

                        deltasTotais.set(
                            item.produtoId,
                            atual +
                            item.delta
                        );
                    }
                }

                const saldos =
                    new Map<
                        ProdutoId,
                        number
                    >();

                for (
                    const item
                    of estoquePrincipal.itens
                ) {

                    const delta =
                        deltasTotais.get(
                            item.produtoId
                        ) ?? 0;

                    saldos.set(
                        item.produtoId,
                        item.quantidade -
                        delta
                    );
                }

                const cronologico =
                    [...lista].sort(
                        (a, b) =>
                            new Date(
                                a.data
                            ).getTime() -
                            new Date(
                                b.data
                            ).getTime()
                    );

                for (
                    const evento
                    of cronologico
                ) {

                    for (
                        const item
                        of evento.itens
                    ) {

                        const anterior =
                            saldos.get(
                                item.produtoId
                            ) ?? 0;

                        const posterior =
                            anterior +
                            item.delta;

                        item.saldoAnterior =
                            anterior;

                        item.saldoPosterior =
                            posterior;

                        saldos.set(
                            item.produtoId,
                            posterior
                        );
                    }
                }

                return cronologico.sort(
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
                estoquePrincipal,
                movimentos,
                retiradas,
                devolucoes
            ]
        );

    const filtrados =
        useMemo(
            () => {

                if (
                    filtro ===
                    "TODOS"
                ) {
                    return eventos;
                }

                if (
                    filtro ===
                    "ENTRADAS"
                ) {

                    return eventos.filter(
                        (evento) =>
                            evento.tipo ===
                                "ENTRADA" ||
                            evento.tipo ===
                                "DEVOLUCAO"
                    );
                }

                return eventos.filter(
                    (evento) =>
                        evento.tipo ===
                            "AJUSTE_SAIDA" ||
                        evento.tipo ===
                            "RETIRADA_PESSOAL"
                );
            },
            [
                eventos,
                filtro
            ]
        );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={
                styles.conteudo
            }
        >

            <Text
                style={styles.titulo}
            >
                Histórico do Estoque Principal
            </Text>

            <Text
                style={styles.subtitulo}
            >
                Extrato completo de tudo que alterou o estoque central
            </Text>

            <View
                style={styles.filtros}
            >

                {
                    [
                        ["TODOS", "Todos"],
                        ["ENTRADAS", "Entradas"],
                        ["SAIDAS", "Saídas"]
                    ].map(
                        ([valor, nome]) => (

                            <TouchableOpacity
                                key={
                                    valor
                                }

                                style={[
                                    styles.filtro,

                                    filtro ===
                                        valor &&
                                    styles.filtroAtivo
                                ]}

                                onPress={
                                    () =>
                                        setFiltro(
                                            valor as
                                                "TODOS" |
                                                "ENTRADAS" |
                                                "SAIDAS"
                                        )
                                }
                            >

                                <Text
                                    style={[
                                        styles.filtroTexto,

                                        filtro ===
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
                            <Text
                                style={styles.vazioTitulo}
                            >
                                Nenhuma movimentação
                            </Text>
                        </View>
                    )
                    : filtrados.map(
                        (evento) => {

                            const total =
                                evento.itens.reduce(
                                    (soma, item) =>
                                        soma +
                                        Math.abs(
                                            item.delta
                                        ),
                                    0
                                );

                            const entrada =
                                evento.itens.reduce(
                                    (soma, item) =>
                                        soma +
                                        item.delta,
                                    0
                                ) >
                                0;

                            return (
                                <View
                                    key={
                                        evento.id
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
                                                        evento.tipo
                                                    )
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.cardTitulo
                                                }
                                            >
                                                {
                                                    evento.titulo
                                                }
                                            </Text>

                                        </View>

                                        <Text
                                            style={
                                                styles.total
                                            }
                                        >
                                            {
                                                entrada
                                                    ? "+"
                                                    : "-"
                                            }
                                            {total}
                                        </Text>

                                    </View>

                                    <Text
                                        style={
                                            styles.descricao
                                        }
                                    >
                                        {
                                            evento.descricao
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.responsavel
                                        }
                                    >
                                        Registrado por: {
                                            nomeResponsavel(
                                                evento.responsavelId
                                            )
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.data
                                        }
                                    >
                                        {
                                            new Date(
                                                evento.data
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
                                            evento.itens.map(
                                                (item) => (

                                                    <View
                                                        key={
                                                            item.produtoId
                                                        }
                                                        style={
                                                            styles.item
                                                        }
                                                    >

                                                        <View>
                                                            <Text
                                                                style={
                                                                    styles.itemNome
                                                                }
                                                            >
                                                                {
                                                                    nomeProduto(
                                                                        item.produtoId
                                                                    )
                                                                }
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    styles.saldo
                                                                }
                                                            >
                                                                {
                                                                    item.saldoAnterior
                                                                } → {
                                                                    item.saldoPosterior
                                                                }
                                                            </Text>
                                                        </View>

                                                        <Text
                                                            style={
                                                                styles.itemQuantidade
                                                            }
                                                        >
                                                            {
                                                                item.delta >=
                                                                0
                                                                    ? "+"
                                                                    : ""
                                                            }
                                                            {
                                                                item.delta
                                                            }
                                                        </Text>

                                                    </View>
                                                )
                                            )
                                        }

                                    </View>

                                    {
                                        evento.observacao
                                            ? (
                                                <View
                                                    style={
                                                        styles.observacao
                                                    }
                                                >

                                                    <Text
                                                        style={
                                                            styles.observacaoTitulo
                                                        }
                                                    >
                                                        Observação
                                                    </Text>

                                                    <Text>
                                                        {
                                                            evento.observacao
                                                        }
                                                    </Text>

                                                </View>
                                            )
                                            : null
                                    }

                                </View>
                            );
                        }
                    )
            }

        </ScrollView>
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
            marginBottom: 22
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
            flex: 1,
            paddingRight: 10
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

        responsavel: {
            color: "#666666",
            fontSize: 12,
            marginTop: 4
        },

        data: {
            color: "#777777",
            fontSize: 12,
            marginTop: 3
        },

        itens: {
            borderTopWidth: 1,
            borderTopColor: "#EEEEEE",
            paddingTop: 10,
            marginTop: 14
        },

        item: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 9
        },

        itemNome: {
            fontWeight: "700"
        },

        saldo: {
            color: "#777777",
            fontSize: 12,
            marginTop: 2
        },

        itemQuantidade: {
            fontWeight: "800",
            fontSize: 16
        },

        observacao: {
            backgroundColor: "#F7F7F7",
            padding: 10,
            borderRadius: 8,
            marginTop: 8
        },

        observacaoTitulo: {
            fontSize: 11,
            fontWeight: "700",
            color: "#777777",
            marginBottom: 3
        },

        vazio: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 20
        },

        vazioTitulo: {
            fontWeight: "700",
            textAlign: "center"
        }
    });
