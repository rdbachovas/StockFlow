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

import {
    SolicitacaoConsumoCarrinho
} from "../models/ConsumoCarrinho";

import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";

import {
    nomeProduto,
    PRODUTOS_CARRINHO
} from "../utils/ProdutoUtils";

interface Props {

    estoqueRodrigo: Estoque;

    estoqueCesar: Estoque;

    registrarConsumo:
        (
            solicitacao:
                SolicitacaoConsumoCarrinho
        ) => void;
}

export function ConsumoCarrinhoScreen({
    estoqueRodrigo,
    estoqueCesar,
    registrarConsumo
}: Props) {

    const [
        responsavel,
        setResponsavel
    ] = useState<UsuarioId>(
        UsuarioId.RODRIGO
    );

    const [
        quantidades,
        setQuantidades
    ] = useState<
        Record<string, string>
    >({});

    const [
        observacao,
        setObservacao
    ] = useState("");

    const [
        erro,
        setErro
    ] = useState<
        string | null
    >(null);

    const [
        sucesso,
        setSucesso
    ] = useState<
        string | null
    >(null);

    const estoque =
        responsavel ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

    const quantidadeAtual = (
        produtoId: ProdutoId
    ): number => {

        return (
            estoque.itens.find(
                (item) =>
                    item.produtoId ===
                    produtoId
            )?.quantidade ?? 0
        );
    };

    const itens =
        useMemo(
            () => {

                return PRODUTOS_CARRINHO
                    .map(
                        (produtoId) => ({
                            produtoId,

                            quantidade:
                                Number(
                                    quantidades[
                                        produtoId
                                    ] || 0
                                )
                        })
                    )
                    .filter(
                        (item) =>
                            item.quantidade >
                            0
                    );
            },
            [quantidades]
        );

    const total =
        useMemo(
            () =>
                itens.reduce(
                    (soma, item) =>
                        soma +
                        item.quantidade,
                    0
                ),
            [itens]
        );

    const confirmar =
        () => {

            setErro(null);
            setSucesso(null);

            if (
                itens.length === 0
            ) {

                setErro(
                    "Informe pelo menos um insumo consumido."
                );

                return;
            }

            const solicitacao:
                SolicitacaoConsumoCarrinho = {

                id:
                    `CONS_CARRINHO_${Date.now()}`,

                responsavelId:
                    responsavel,

                itens,

                data:
                    new Date(),

                observacao:
                    observacao.trim() ||
                    undefined
            };

            try {

                registrarConsumo(
                    solicitacao
                );

                setQuantidades({});

                setObservacao("");

                setSucesso(
                    `${total} itens baixados do estoque pessoal.`
                );

            } catch (e) {

                setErro(
                    e instanceof Error
                        ? e.message
                        : "Erro ao registrar consumo."
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
                🍿 Consumo do Carrinho
            </Text>

            <Text
                style={styles.subtitulo}
            >
                Registre os insumos utilizados no carrinho de pipoca
            </Text>

            <Text
                style={styles.secaoTitulo}
            >
                De quem saiu?
            </Text>

            <View
                style={styles.seletor}
            >

                {
                    [
                        UsuarioId.RODRIGO,
                        UsuarioId.CESAR
                    ].map(
                        (usuario) => (

                            <TouchableOpacity
                                key={
                                    usuario
                                }

                                style={[
                                    styles.opcao,

                                    responsavel ===
                                        usuario &&
                                    styles.opcaoAtiva
                                ]}

                                onPress={
                                    () => {

                                        setResponsavel(
                                            usuario
                                        );

                                        setQuantidades({});

                                        setErro(null);

                                        setSucesso(null);
                                    }
                                }
                            >

                                <Text
                                    style={[
                                        styles.opcaoTexto,

                                        responsavel ===
                                            usuario &&
                                        styles.opcaoTextoAtivo
                                    ]}
                                >
                                    {
                                        usuario ===
                                        UsuarioId.RODRIGO
                                            ? "Rodrigo"
                                            : "Cesar"
                                    }
                                </Text>

                            </TouchableOpacity>
                        )
                    )
                }

            </View>

            <Text
                style={styles.secaoTitulo}
            >
                Insumos utilizados
            </Text>

            {
                PRODUTOS_CARRINHO.map(
                    (produtoId) => {

                        const atual =
                            quantidadeAtual(
                                produtoId
                            );

                        const usado =
                            Number(
                                quantidades[
                                    produtoId
                                ] || 0
                            );

                        const depois =
                            atual -
                            usado;

                        return (
                            <View
                                key={
                                    produtoId
                                }
                                style={
                                    styles.card
                                }
                            >

                                <View
                                    style={
                                        styles.info
                                    }
                                >

                                    <Text
                                        style={
                                            styles.produto
                                        }
                                    >
                                        {
                                            nomeProduto(
                                                produtoId
                                            )
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.saldo
                                        }
                                    >
                                        Em posse: {atual}
                                    </Text>

                                    {
                                        usado > 0
                                            ? (
                                                <Text
                                                    style={[
                                                        styles.depois,

                                                        depois < 0 &&
                                                        styles.negativo
                                                    ]}
                                                >
                                                    Depois: {
                                                        depois
                                                    }
                                                </Text>
                                            )
                                            : null
                                    }

                                </View>

                                <TextInput
                                    style={
                                        styles.input
                                    }

                                    value={
                                        quantidades[
                                            produtoId
                                        ] ?? ""
                                    }

                                    onChangeText={
                                        (valor) => {

                                            setQuantidades(
                                                (anterior) => ({
                                                    ...anterior,

                                                    [produtoId]:
                                                        valor.replace(
                                                            /[^0-9]/g,
                                                            ""
                                                        )
                                                })
                                            );

                                            setErro(null);
                                            setSucesso(null);
                                        }
                                    }

                                    keyboardType="number-pad"

                                    placeholder="0"
                                />

                            </View>
                        );
                    }
                )
            }

            <Text
                style={styles.secaoTitulo}
            >
                Observação
            </Text>

            <TextInput
                style={
                    styles.observacao
                }

                value={
                    observacao
                }

                onChangeText={
                    setObservacao
                }

                multiline

                placeholder="Ex.: consumo do evento de domingo"
            />

            <View
                style={styles.totalCard}
            >

                <Text>
                    Total consumido
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
                sucesso
                    ? (
                        <View
                            style={styles.sucesso}
                        >
                            <Text
                                style={styles.sucessoTitulo}
                            >
                                ✓ Consumo registrado
                            </Text>

                            <Text>
                                {sucesso}
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
                    Registrar consumo
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
            color: "#666666",
            marginTop: 4,
            marginBottom: 24
        },

        secaoTitulo: {
            fontSize: 19,
            fontWeight: "700",
            marginBottom: 10
        },

        seletor: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 25
        },

        opcao: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            padding: 13,
            borderRadius: 11,
            alignItems: "center"
        },

        opcaoAtiva: {
            backgroundColor: "#111111",
            borderColor: "#111111"
        },

        opcaoTexto: {
            fontWeight: "700"
        },

        opcaoTextoAtivo: {
            color: "#FFFFFF"
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 14,
            marginBottom: 9,
            flexDirection: "row",
            alignItems: "center"
        },

        info: {
            flex: 1
        },

        produto: {
            fontSize: 17,
            fontWeight: "700"
        },

        saldo: {
            color: "#666666",
            fontSize: 13,
            marginTop: 3
        },

        depois: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 3
        },

        negativo: {
            color: "#B00020"
        },

        input: {
            width: 90,
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 9,
            padding: 10,
            textAlign: "center",
            fontSize: 18
        },

        observacao: {
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 12,
            padding: 14,
            minHeight: 80,
            textAlignVertical: "top",
            marginBottom: 18
        },

        totalCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14
        },

        total: {
            fontSize: 26,
            fontWeight: "800"
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
            marginBottom: 3
        },

        botao: {
            backgroundColor: "#111111",
            borderRadius: 12,
            padding: 16,
            alignItems: "center"
        },

        botaoTexto: {
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 17
        }
    });
