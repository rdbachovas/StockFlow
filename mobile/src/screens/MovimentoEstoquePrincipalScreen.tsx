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

import {
    SolicitacaoMovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";

import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";

import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {

    estoquePrincipal: Estoque;

    registrarMovimento:
        (
            solicitacao:
                SolicitacaoMovimentoEstoquePrincipal
        ) => void;
}

export function MovimentoEstoquePrincipalScreen({
    estoquePrincipal,
    registrarMovimento
}: Props) {

    const [
        tipo,
        setTipo
    ] = useState<TipoMovimentoEstoquePrincipal>(
        TipoMovimentoEstoquePrincipal.ENTRADA
    );

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
        sucesso,
        setSucesso
    ] = useState<string | null>(
        null
    );

    const [
        erro,
        setErro
    ] = useState<string | null>(
        null
    );

    const todosProdutos = [
        ...PRODUTOS_PELUCIAS,
        ...PRODUTOS_CARRINHO
    ];

    const itens =
        useMemo(
            () => {

                return todosProdutos
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

    const saldoAtual = (
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

    const saldoProjetado = (
        produtoId: ProdutoId
    ): number => {

        const atual =
            saldoAtual(
                produtoId
            );

        const valor =
            Number(
                quantidades[
                    produtoId
                ] || 0
            );

        if (
            tipo ===
            TipoMovimentoEstoquePrincipal.ENTRADA
        ) {
            return atual + valor;
        }

        return atual - valor;
    };

    const confirmar =
        () => {

            setErro(null);
            setSucesso(null);

            if (
                itens.length === 0
            ) {

                setErro(
                    "Informe pelo menos uma quantidade."
                );

                return;
            }

            const solicitacao:
                SolicitacaoMovimentoEstoquePrincipal = {

                id:
                    `MOV_PRINCIPAL_${Date.now()}`,

                tipo,

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

                registrarMovimento(
                    solicitacao
                );

                setQuantidades({});
                setObservacao("");

                setSucesso(
                    tipo ===
                        TipoMovimentoEstoquePrincipal.ENTRADA
                        ? `${total} itens adicionados ao Estoque Principal.`
                        : `${total} itens removidos do Estoque Principal.`
                );

            } catch (e) {

                setErro(
                    e instanceof Error
                        ? e.message
                        : "Erro ao atualizar o estoque."
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
                                saldoAtual(
                                    produtoId
                                );

                            const projetado =
                                saldoProjetado(
                                    produtoId
                                );

                            const digitado =
                                Number(
                                    quantidades[
                                        produtoId
                                    ] || 0
                                );

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
                                            Atual: {atual}
                                        </Text>

                                        {
                                            digitado > 0
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
                                            styles.inputQuantidade
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
                Atualizar Estoque Principal
            </Text>

            <Text
                style={styles.subtitulo}
            >
                Registre novas mercadorias, insumos ou correções de estoque
            </Text>

            <Text
                style={styles.secaoTitulo}
            >
                Tipo
            </Text>

            <View
                style={styles.seletor}
            >

                <TouchableOpacity
                    style={[
                        styles.opcao,

                        tipo ===
                            TipoMovimentoEstoquePrincipal.ENTRADA &&
                        styles.opcaoAtiva
                    ]}
                    onPress={
                        () => {
                            setTipo(
                                TipoMovimentoEstoquePrincipal.ENTRADA
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

                            tipo ===
                                TipoMovimentoEstoquePrincipal.ENTRADA &&
                            styles.opcaoTextoAtivo
                        ]}
                    >
                        + Entrada
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.opcao,

                        tipo ===
                            TipoMovimentoEstoquePrincipal.SAIDA &&
                        styles.opcaoAtiva
                    ]}
                    onPress={
                        () => {
                            setTipo(
                                TipoMovimentoEstoquePrincipal.SAIDA
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

                            tipo ===
                                TipoMovimentoEstoquePrincipal.SAIDA &&
                            styles.opcaoTextoAtivo
                        ]}
                    >
                        - Remover
                    </Text>
                </TouchableOpacity>

            </View>

            <Text
                style={styles.secaoTitulo}
            >
                Quem está registrando?
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
                        () =>
                            setResponsavel(
                                UsuarioId.RODRIGO
                            )
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
                        () =>
                            setResponsavel(
                                UsuarioId.CESAR
                            )
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
                    "Reposição das máquinas de pelúcias",
                    PRODUTOS_PELUCIAS
                )
            }

            {
                renderGrupo(
                    "🍿 Carrinho de Pipoca",
                    "Reposição de milho, chocolate, embalagens e óleo",
                    PRODUTOS_CARRINHO
                )
            }

            <Text
                style={styles.secaoTitulo}
            >
                Observação
            </Text>

            <TextInput
                style={styles.inputObservacao}

                value={
                    observacao
                }

                onChangeText={
                    setObservacao
                }

                placeholder={
                    tipo ===
                        TipoMovimentoEstoquePrincipal.ENTRADA
                        ? "Ex.: carga recebida do fornecedor"
                        : "Ex.: perda, correção de contagem..."
                }

                multiline
            />

            <View
                style={styles.totalCard}
            >
                <Text>
                    Total da movimentação
                </Text>

                <Text
                    style={styles.total}
                >
                    {
                        tipo ===
                            TipoMovimentoEstoquePrincipal.ENTRADA
                            ? "+"
                            : "-"
                    }
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
                                ✓ Estoque atualizado
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
                    {
                        tipo ===
                            TipoMovimentoEstoquePrincipal.ENTRADA
                            ? "Registrar entrada"
                            : "Registrar remoção"
                    }
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
            marginBottom: 26,
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
            marginBottom: 24
        },

        opcao: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 11,
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
            color: "#666666",
            fontSize: 13,
            marginTop: 3,
            marginBottom: 12
        },

        cardProduto: {
            backgroundColor: "#FFFFFF",
            padding: 14,
            borderRadius: 12,
            marginBottom: 9,
            flexDirection: "row",
            alignItems: "center"
        },

        produtoInfo: {
            flex: 1
        },

        produtoNome: {
            fontSize: 17,
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

        inputQuantidade: {
            width: 90,
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 9,
            padding: 10,
            fontSize: 18,
            textAlign: "center"
        },

        inputObservacao: {
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 12,
            padding: 14,
            minHeight: 85,
            textAlignVertical: "top",
            marginBottom: 18
        },

        totalCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14
        },

        total: {
            fontSize: 25,
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
            fontSize: 17,
            fontWeight: "700"
        }
    });
