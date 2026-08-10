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

import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";

import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {

    estoquePrincipal: Estoque;

    estoqueRodrigo: Estoque;

    estoqueCesar: Estoque;

    registrarRetirada:
        (
            retirada: RetiradaEstoque
        ) => void;
}

export function EstoquePrincipalScreen({
    estoquePrincipal,
    estoqueRodrigo,
    estoqueCesar,
    registrarRetirada
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
        sucesso,
        setSucesso
    ] = useState<
        string | null
    >(null);

    const [
        erro,
        setErro
    ] = useState<
        string | null
    >(null);

    const estoqueDestino =
        responsavel ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

    const quantidadePrincipal = (
        produtoId: ProdutoId
    ): number => {

        return (
            estoquePrincipal.itens.find(
                (item) =>
                    item.produtoId ===
                    produtoId
            )?.quantidade ?? 0
        );
    };

    const itensRetirada =
        useMemo(
            () => {

                return [
                    ...PRODUTOS_PELUCIAS,
                    ...PRODUTOS_CARRINHO
                ]
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
                            item.quantidade > 0
                    );
            },
            [quantidades]
        );

    const totalRetirada =
        useMemo(
            () => {

                return itensRetirada.reduce(
                    (total, item) =>
                        total +
                        item.quantidade,
                    0
                );
            },
            [itensRetirada]
        );

    const alterarQuantidade = (
        produtoId: ProdutoId,
        valor: string
    ) => {

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
    };

    const confirmar =
        () => {

            setErro(null);
            setSucesso(null);

            if (
                itensRetirada.length === 0
            ) {

                setErro(
                    "Informe pelo menos uma quantidade."
                );

                return;
            }

            const retirada:
                RetiradaEstoque = {

                id:
                    `RET_${Date.now()}`,

                estoqueOrigemId:
                    estoquePrincipal.id,

                estoqueDestinoId:
                    estoqueDestino.id,

                responsavelId:
                    responsavel,

                itens:
                    itensRetirada,

                data:
                    new Date()
            };

            try {

                registrarRetirada(
                    retirada
                );

                setQuantidades({});

                setSucesso(
                    `${totalRetirada} itens enviados para ${responsavel === UsuarioId.RODRIGO ? "Rodrigo" : "Cesar"}.`
                );

            } catch (e) {

                setErro(
                    e instanceof Error
                        ? e.message
                        : "Erro ao registrar retirada."
                );
            }
        };

    const renderGrupo = (
        titulo: string,
        descricao: string,
        produtos: ProdutoId[]
    ) => {

        return (
            <View
                style={styles.grupo}
            >

                <Text
                    style={styles.grupoTitulo}
                >
                    {titulo}
                </Text>

                <Text
                    style={styles.grupoDescricao}
                >
                    {descricao}
                </Text>

                {
                    produtos.map(
                        (produtoId) => {

                            const atual =
                                quantidadePrincipal(
                                    produtoId
                                );

                            const retirada =
                                Number(
                                    quantidades[
                                        produtoId
                                    ] || 0
                                );

                            const projetado =
                                atual -
                                retirada;

                            return (
                                <View
                                    key={
                                        produtoId
                                    }
                                    style={
                                        styles.cardProduto
                                    }
                                >

                                    <View
                                        style={
                                            styles.produtoInfo
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.produtoNome
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
                                                styles.produtoSaldo
                                            }
                                        >
                                            Principal: {atual}
                                        </Text>

                                        {
                                            retirada > 0
                                                ? (
                                                    <Text
                                                        style={[
                                                            styles.projecao,

                                                            projetado < 0 &&
                                                            styles.negativo
                                                        ]}
                                                    >
                                                        Depois: {projetado}
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
                                            (valor) =>
                                                alterarQuantidade(
                                                    produtoId,
                                                    valor
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

            </View>
        );
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
                Estoque Principal
            </Text>

            <Text
                style={styles.subtitulo}
            >
                Retire produtos do estoque central e transfira para um estoque pessoal
            </Text>

            <Text
                style={styles.secaoTitulo}
            >
                Quem está retirando?
            </Text>

            <View
                style={styles.seletor}
            >

                <TouchableOpacity
                    style={[
                        styles.opcao,

                        responsavel ===
                            UsuarioId.RODRIGO &&
                        styles.opcaoAtiva
                    ]}
                    onPress={
                        () => {
                            setResponsavel(
                                UsuarioId.RODRIGO
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
                                UsuarioId.RODRIGO &&
                            styles.opcaoTextoAtivo
                        ]}
                    >
                        Rodrigo
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.opcao,

                        responsavel ===
                            UsuarioId.CESAR &&
                        styles.opcaoAtiva
                    ]}
                    onPress={
                        () => {
                            setResponsavel(
                                UsuarioId.CESAR
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
                                UsuarioId.CESAR &&
                            styles.opcaoTextoAtivo
                        ]}
                    >
                        Cesar
                    </Text>
                </TouchableOpacity>

            </View>

            {
                renderGrupo(
                    "🧸 Pelúcias",
                    "Produtos utilizados nas máquinas",
                    PRODUTOS_PELUCIAS
                )
            }

            {
                renderGrupo(
                    "🍿 Carrinho de Pipoca",
                    "Insumos que podem ficar com Rodrigo ou Cesar",
                    PRODUTOS_CARRINHO
                )
            }

            <View
                style={styles.totalCard}
            >
                <Text>
                    Total da retirada
                </Text>

                <Text
                    style={styles.total}
                >
                    {totalRetirada}
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
                                ✓ Retirada registrada
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
                    Confirmar retirada
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
            fontSize: 30,
            fontWeight: "800"
        },

        subtitulo: {
            color: "#666666",
            marginTop: 4,
            marginBottom: 24,
            lineHeight: 20
        },

        secaoTitulo: {
            fontSize: 19,
            fontWeight: "700",
            marginBottom: 10
        },

        seletor: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 28
        },

        opcao: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 12,
            padding: 13,
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

        grupo: {
            marginBottom: 26
        },

        grupoTitulo: {
            fontSize: 21,
            fontWeight: "800"
        },

        grupoDescricao: {
            fontSize: 13,
            color: "#666666",
            marginTop: 3,
            marginBottom: 12
        },

        cardProduto: {
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 14,
            marginBottom: 9,
            flexDirection: "row",
            alignItems: "center"
        },

        produtoInfo: {
            flex: 1
        },

        produtoNome: {
            fontSize: 16,
            fontWeight: "700"
        },

        produtoSaldo: {
            color: "#666666",
            fontSize: 13,
            marginTop: 3
        },

        projecao: {
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
            borderRadius: 12,
            padding: 14,
            marginBottom: 14
        },

        sucesso: {
            backgroundColor: "#E8F5E9",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14
        },

        sucessoTitulo: {
            fontWeight: "700",
            marginBottom: 4
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
        }
    });
