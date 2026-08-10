import React, {
    useMemo,
    useState
} from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { DestinoReservaId } from "../models/DestinoReserva";

import {
    DevolucaoEstoque
} from "../models/DevolucaoEstoque";

import { ProdutoId } from "../models/Produto";

import {
    Reserva,
    StatusReserva
} from "../models/Reserva";

import { UsuarioId } from "../models/Usuario";

import { Estoque } from "../models/Estoque";

import { ReservaService } from "../services/ReservaService";

interface Props {

    responsavelId: UsuarioId;

    produtoId: ProdutoId;

    estoquePessoal: Estoque;

    estoquePrincipal: Estoque;

    reservas: Reserva[];

    registrarDevolucao:
        (
            devolucao: DevolucaoEstoque
        ) => void;
}

function nomeProduto(
    produtoId: ProdutoId
): string {

    switch (produtoId) {

        case ProdutoId.MIX:
            return "Mix";

        case ProdutoId.PERSONAGENS:
            return "Personagens";

        case ProdutoId.CAPIVARAS:
            return "Capivaras";

        case ProdutoId.BIG:
            return "Big";

        case ProdutoId.STITCH:
            return "Stitch";

        case ProdutoId.POKEMON:
            return "Pokémon";

        case ProdutoId.LABUBU:
            return "Labubu";

        default:
            return produtoId;
    }
}

function nomeDestino(
    destinoId: DestinoReservaId
): string {

    switch (destinoId) {

        case DestinoReservaId.BOULEVARD:
            return "Boulevard";

        case DestinoReservaId.AEROPORTO:
            return "Aeroporto";

        case DestinoReservaId.MERCADOS:
            return "Mercados";

        case DestinoReservaId.SUPERMAGO_BOA_VISTA:
            return "SuperMago Boa Vista";
    }
}

export function DevolucaoEstoqueScreen({
    responsavelId,
    produtoId,
    estoquePessoal,
    estoquePrincipal,
    reservas,
    registrarDevolucao
}: Props) {

    const [
        quantidadeLivre,
        setQuantidadeLivre
    ] = useState("");

    const [
        quantidadesReservas,
        setQuantidadesReservas
    ] = useState<
        Record<string, string>
    >({});

    const [
        mensagem,
        setMensagem
    ] = useState<
        string | null
    >(null);

    const [
        erro,
        setErro
    ] = useState<
        string | null
    >(null);

    const fisico =
        estoquePessoal.itens.find(
            (item) =>
                item.produtoId ===
                produtoId
        )?.quantidade ?? 0;

    const livre =
        ReservaService
            .quantidadeDisponivel(
                estoquePessoal,
                reservas,
                produtoId
            );

    const reservasProduto =
        reservas.filter(
            (reserva) =>
                reserva.responsavelId ===
                    responsavelId &&
                reserva.produtoId ===
                    produtoId &&
                reserva.status ===
                    StatusReserva.ATIVA
        );

    const destinos =
        useMemo(
            () => {

                return Array.from(
                    new Set(
                        reservasProduto.map(
                            (reserva) =>
                                reserva.destinoId
                        )
                    )
                );

            },
            [reservasProduto]
        );

    const total =
        useMemo(
            () => {

                let resultado =
                    Number(
                        quantidadeLivre ||
                        0
                    );

                for (
                    const destino
                    of destinos
                ) {

                    resultado +=
                        Number(
                            quantidadesReservas[
                                destino
                            ] ||
                            0
                        );
                }

                return resultado;

            },
            [
                quantidadeLivre,
                quantidadesReservas,
                destinos
            ]
        );

    const confirmar =
        () => {

            setErro(null);
            setMensagem(null);

            if (
                total <= 0
            ) {
                setErro(
                    "Informe alguma quantidade para devolver."
                );

                return;
            }

            const parcelas =
                destinos
                    .map(
                        (destinoId) => ({
                            destinoId,

                            quantidade:
                                Number(
                                    quantidadesReservas[
                                        destinoId
                                    ] ||
                                    0
                                )
                        })
                    )
                    .filter(
                        (parcela) =>
                            parcela.quantidade >
                            0
                    );

            const devolucao:
                DevolucaoEstoque = {

                id:
                    `DEV_${Date.now()}`,

                estoqueOrigemId:
                    estoquePessoal.id,

                estoqueDestinoId:
                    estoquePrincipal.id,

                responsavelId,

                itens: [
                    {
                        produtoId,

                        quantidadeLivre:
                            Number(
                                quantidadeLivre ||
                                0
                            ),

                        reservas:
                            parcelas
                    }
                ],

                data:
                    new Date()
            };

            try {

                registrarDevolucao(
                    devolucao
                );

                setQuantidadeLivre("");

                setQuantidadesReservas({});

                setMensagem(
                    `${total} ${nomeProduto(produtoId)} devolvidos ao Estoque Principal.`
                );

            } catch (e) {

                setErro(
                    e instanceof Error
                        ? e.message
                        : "Erro ao registrar devolução."
                );
            }
        };

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
                Devolver ao Principal
            </Text>

            <Text
                style={styles.subtitulo}
            >
                {nomeProduto(produtoId)}
            </Text>

            <View
                style={styles.resumo}
            >

                <View
                    style={styles.linha}
                >
                    <Text>
                        Estoque físico
                    </Text>

                    <Text
                        style={styles.valor}
                    >
                        {fisico}
                    </Text>
                </View>

                <View
                    style={styles.linha}
                >
                    <Text>
                        Livre
                    </Text>

                    <Text
                        style={styles.valor}
                    >
                        {livre}
                    </Text>
                </View>

            </View>

            <Text
                style={styles.secaoTitulo}
            >
                Estoque livre
            </Text>

            <View
                style={styles.card}
            >

                <View
                    style={styles.itemInfo}
                >
                    <Text
                        style={styles.itemTitulo}
                    >
                        Livre
                    </Text>

                    <Text
                        style={styles.itemDescricao}
                    >
                        Máximo: {livre}
                    </Text>
                </View>

                <TextInput
                    style={styles.input}
                    value={
                        quantidadeLivre
                    }
                    onChangeText={
                        (valor) =>
                            setQuantidadeLivre(
                                valor.replace(
                                    /[^0-9]/g,
                                    ""
                                )
                            )
                    }
                    keyboardType="number-pad"
                    placeholder="0"
                />

            </View>

            {
                destinos.length > 0
                    ? (
                        <>
                            <Text
                                style={styles.secaoTitulo}
                            >
                                Estoque reservado
                            </Text>

                            {
                                destinos.map(
                                    (destinoId) => {

                                        const reservado =
                                            ReservaService
                                                .quantidadeReservadaNoDestino(
                                                    reservas,
                                                    produtoId,
                                                    responsavelId,
                                                    destinoId
                                                );

                                        return (
                                            <View
                                                key={
                                                    destinoId
                                                }
                                                style={
                                                    styles.card
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.itemInfo
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.itemTitulo
                                                        }
                                                    >
                                                        {
                                                            nomeDestino(
                                                                destinoId
                                                            )
                                                        }
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.itemDescricao
                                                        }
                                                    >
                                                        Reservado: {
                                                            reservado
                                                        }
                                                    </Text>
                                                </View>

                                                <TextInput
                                                    style={
                                                        styles.input
                                                    }

                                                    value={
                                                        quantidadesReservas[
                                                            destinoId
                                                        ] ?? ""
                                                    }

                                                    onChangeText={
                                                        (valor) =>
                                                            setQuantidadesReservas(
                                                                (
                                                                    anterior
                                                                ) => ({
                                                                    ...anterior,

                                                                    [destinoId]:
                                                                        valor.replace(
                                                                            /[^0-9]/g,
                                                                            ""
                                                                        )
                                                                })
                                                            )
                                                    }

                                                    keyboardType="number-pad"

                                                    placeholder="0"
                                                />

                                            </View>
                                        );
                                    }
                                )
                            }
                        </>
                    )
                    : null
            }

            <View
                style={styles.totalCard}
            >
                <Text>
                    Total a devolver
                </Text>

                <Text
                    style={styles.total}
                >
                    {total}
                </Text>
            </View>

            {
                erro
                    ? (
                        <View
                            style={styles.erro}
                        >
                            <Text>
                                {erro}
                            </Text>
                        </View>
                    )
                    : null
            }

            {
                mensagem
                    ? (
                        <View
                            style={styles.sucesso}
                        >
                            <Text
                                style={
                                    styles.sucessoTitulo
                                }
                            >
                                ✓ Devolução realizada
                            </Text>

                            <Text>
                                {mensagem}
                            </Text>
                        </View>
                    )
                    : null
            }

            <TouchableOpacity
                style={styles.botao}
                onPress={
                    confirmar
                }
            >
                <Text
                    style={styles.botaoTexto}
                >
                    Confirmar devolução
                </Text>
            </TouchableOpacity>

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
            fontSize: 20,
            color: "#666666",
            marginTop: 4,
            marginBottom: 24
        },

        resumo: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 24
        },

        linha: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8
        },

        valor: {
            fontSize: 18,
            fontWeight: "800"
        },

        secaoTitulo: {
            fontSize: 19,
            fontWeight: "700",
            marginBottom: 10
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center"
        },

        itemInfo: {
            flex: 1
        },

        itemTitulo: {
            fontSize: 17,
            fontWeight: "700"
        },

        itemDescricao: {
            color: "#666666",
            fontSize: 13,
            marginTop: 3
        },

        input: {
            width: 85,
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 9,
            padding: 10,
            textAlign: "center",
            fontSize: 18
        },

        totalCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginTop: 14,
            marginBottom: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
        },

        total: {
            fontSize: 26,
            fontWeight: "800"
        },

        botao: {
            backgroundColor: "#111111",
            borderRadius: 12,
            padding: 16,
            alignItems: "center"
        },

        botaoTexto: {
            color: "#FFFFFF",
            fontSize: 17,
            fontWeight: "700"
        },

        erro: {
            backgroundColor: "#FFEBEE",
            padding: 14,
            borderRadius: 12,
            marginBottom: 14
        },

        sucesso: {
            backgroundColor: "#E8F5E9",
            padding: 14,
            borderRadius: 12,
            marginBottom: 14
        },

        sucessoTitulo: {
            fontWeight: "700",
            marginBottom: 4
        }
    });
