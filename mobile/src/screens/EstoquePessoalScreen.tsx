import React, {
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
    Link
} from "expo-router";

import {
    DestinoReservaId
} from "../models/DestinoReserva";

import {
    Estoque
} from "../models/Estoque";

import {
    ProdutoId
} from "../models/Produto";

import {
    Reserva,
    StatusReserva
} from "../models/Reserva";

import {
    UsuarioId
} from "../models/Usuario";

import {
    ReservaService
} from "../services/ReservaService";

import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {
    estoqueRodrigo: Estoque;
    estoqueCesar: Estoque;
    reservas: Reserva[];
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

export function EstoquePessoalScreen({
    estoqueRodrigo,
    estoqueCesar,
    reservas
}: Props) {

    const [
        pessoa,
        setPessoa
    ] = useState<UsuarioId>(
        UsuarioId.RODRIGO
    );

    const estoque =
        pessoa ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

    const quantidade = (
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

    const renderPelucias = () => {

        const produtos =
            PRODUTOS_PELUCIAS.filter(
                (produtoId) =>
                    quantidade(
                        produtoId
                    ) > 0
            );

        return (
            <View
                style={styles.grupo}
            >

                <Text
                    style={styles.grupoTitulo}
                >
                    🧸 Pelúcias
                </Text>

                <Text
                    style={styles.grupoDescricao}
                >
                    Estoque utilizado nos abastecimentos das máquinas
                </Text>

                {
                    produtos.length === 0
                        ? (
                            <View
                                style={styles.vazioGrupo}
                            >
                                <Text
                                    style={styles.vazioTexto}
                                >
                                    Nenhuma pelúcia neste estoque.
                                </Text>
                            </View>
                        )
                        : produtos.map(
                            (produtoId) => {

                                const fisico =
                                    quantidade(
                                        produtoId
                                    );

                                const reservado =
                                    ReservaService
                                        .quantidadeReservada(
                                            reservas,
                                            produtoId,
                                            pessoa
                                        );

                                const livre =
                                    ReservaService
                                        .quantidadeDisponivel(
                                            estoque,
                                            reservas,
                                            produtoId
                                        );

                                const reservasProduto =
                                    reservas.filter(
                                        (reserva) =>
                                            reserva.responsavelId ===
                                                pessoa &&
                                            reserva.produtoId ===
                                                produtoId &&
                                            reserva.status ===
                                                StatusReserva.ATIVA
                                    );

                                const destinos =
                                    Array.from(
                                        new Set(
                                            reservasProduto.map(
                                                (reserva) =>
                                                    reserva.destinoId
                                            )
                                        )
                                    );

                                return (
                                    <View
                                        key={
                                            produtoId
                                        }
                                        style={styles.card}
                                    >

                                        <Text
                                            style={styles.produtoNome}
                                        >
                                            {
                                                nomeProduto(
                                                    produtoId
                                                )
                                            }
                                        </Text>

                                        <View
                                            style={styles.numeros}
                                        >

                                            <View
                                                style={styles.numeroColuna}
                                            >
                                                <Text
                                                    style={styles.numeroLabel}
                                                >
                                                    Físico
                                                </Text>

                                                <Text
                                                    style={styles.numeroValor}
                                                >
                                                    {fisico}
                                                </Text>
                                            </View>

                                            <View
                                                style={styles.numeroColuna}
                                            >
                                                <Text
                                                    style={styles.numeroLabel}
                                                >
                                                    Reservado
                                                </Text>

                                                <Text
                                                    style={styles.numeroValor}
                                                >
                                                    {reservado}
                                                </Text>
                                            </View>

                                            <View
                                                style={styles.numeroColuna}
                                            >
                                                <Text
                                                    style={styles.numeroLabel}
                                                >
                                                    Livre
                                                </Text>

                                                <Text
                                                    style={styles.numeroValor}
                                                >
                                                    {livre}
                                                </Text>
                                            </View>

                                        </View>

                                        {
                                            destinos.length > 0
                                                ? (
                                                    <View
                                                        style={styles.alocacao}
                                                    >

                                                        <Text
                                                            style={styles.alocacaoTitulo}
                                                        >
                                                            Alocação
                                                        </Text>

                                                        {
                                                            destinos.map(
                                                                (destinoId) => {

                                                                    const reservadoDestino =
                                                                        ReservaService
                                                                            .quantidadeReservadaNoDestino(
                                                                                reservas,
                                                                                produtoId,
                                                                                pessoa,
                                                                                destinoId
                                                                            );

                                                                    return (
                                                                        <View
                                                                            key={
                                                                                destinoId
                                                                            }
                                                                            style={styles.alocacaoLinha}
                                                                        >
                                                                            <Text>
                                                                                {
                                                                                    nomeDestino(
                                                                                        destinoId
                                                                                    )
                                                                                }
                                                                            </Text>

                                                                            <Text
                                                                                style={styles.alocacaoValor}
                                                                            >
                                                                                {
                                                                                    reservadoDestino
                                                                                }
                                                                            </Text>
                                                                        </View>
                                                                    );
                                                                }
                                                            )
                                                        }

                                                    </View>
                                                )
                                                : null
                                        }

                                        <Link
                                            href={{
                                                pathname:
                                                    "/devolucao",

                                                params: {
                                                    responsavelId:
                                                        pessoa,

                                                    produtoId
                                                }
                                            }}
                                            asChild
                                        >
                                            <TouchableOpacity
                                                style={styles.botaoDevolver}
                                            >
                                                <Text
                                                    style={styles.botaoDevolverTexto}
                                                >
                                                    Devolver ao Principal
                                                </Text>
                                            </TouchableOpacity>
                                        </Link>

                                    </View>
                                );
                            }
                        )
                }

            </View>
        );
    };

    const renderCarrinho = () => {

        const produtos =
            PRODUTOS_CARRINHO.filter(
                (produtoId) =>
                    quantidade(
                        produtoId
                    ) > 0
            );

        return (
            <View
                style={styles.grupo}
            >

                <Text
                    style={styles.grupoTitulo}
                >
                    🍿 Carrinho de Pipoca
                </Text>

                <Text
                    style={styles.grupoDescricao}
                >
                    Insumos atualmente sob responsabilidade de {
                        pessoa ===
                        UsuarioId.RODRIGO
                            ? "Rodrigo"
                            : "Cesar"
                    }
                </Text>

                {
                    produtos.length === 0
                        ? (
                            <View
                                style={styles.vazioGrupo}
                            >
                                <Text
                                    style={styles.vazioTexto}
                                >
                                    Nenhum insumo do carrinho neste estoque.
                                </Text>
                            </View>
                        )
                        : produtos.map(
                            (produtoId) => {

                                const fisico =
                                    quantidade(
                                        produtoId
                                    );

                                return (
                                    <View
                                        key={
                                            produtoId
                                        }
                                        style={styles.card}
                                    >

                                        <Text
                                            style={styles.produtoNome}
                                        >
                                            {
                                                nomeProduto(
                                                    produtoId
                                                )
                                            }
                                        </Text>

                                        <View
                                            style={styles.insumoLinha}
                                        >

                                            <View>
                                                <Text
                                                    style={styles.numeroLabel}
                                                >
                                                    Quantidade em posse
                                                </Text>

                                                <Text
                                                    style={styles.numeroValor}
                                                >
                                                    {fisico}
                                                </Text>
                                            </View>

                                        </View>

                                        <Link
                                            href={{
                                                pathname:
                                                    "/devolucao",

                                                params: {
                                                    responsavelId:
                                                        pessoa,

                                                    produtoId
                                                }
                                            }}
                                            asChild
                                        >
                                            <TouchableOpacity
                                                style={styles.botaoDevolver}
                                            >
                                                <Text
                                                    style={styles.botaoDevolverTexto}
                                                >
                                                    Devolver ao Principal
                                                </Text>
                                            </TouchableOpacity>
                                        </Link>

                                    </View>
                                );
                            }
                        )
                }

            </View>
        );
    };

    const totalPelucias =
        PRODUTOS_PELUCIAS.reduce(
            (total, produtoId) =>
                total +
                quantidade(
                    produtoId
                ),
            0
        );

    const totalCarrinho =
        PRODUTOS_CARRINHO.reduce(
            (total, produtoId) =>
                total +
                quantidade(
                    produtoId
                ),
            0
        );

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
                    Estoque pessoal
                </Text>

                <Text
                    style={styles.subtitulo}
                >
                    Produtos fisicamente sob responsabilidade de cada pessoa
                </Text>

                <View
                    style={styles.seletor}
                >

                    <TouchableOpacity
                        style={[
                            styles.botaoPessoa,

                            pessoa ===
                                UsuarioId.RODRIGO &&
                            styles.botaoSelecionado
                        ]}
                        onPress={
                            () =>
                                setPessoa(
                                    UsuarioId.RODRIGO
                                )
                        }
                    >
                        <Text
                            style={[
                                styles.textoPessoa,

                                pessoa ===
                                    UsuarioId.RODRIGO &&
                                styles.textoSelecionado
                            ]}
                        >
                            Rodrigo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.botaoPessoa,

                            pessoa ===
                                UsuarioId.CESAR &&
                            styles.botaoSelecionado
                        ]}
                        onPress={
                            () =>
                                setPessoa(
                                    UsuarioId.CESAR
                                )
                        }
                    >
                        <Text
                            style={[
                                styles.textoPessoa,

                                pessoa ===
                                    UsuarioId.CESAR &&
                                styles.textoSelecionado
                            ]}
                        >
                            Cesar
                        </Text>
                    </TouchableOpacity>

                </View>

                <View
                    style={styles.resumo}
                >

                    <View
                        style={styles.resumoColuna}
                    >
                        <Text
                            style={styles.resumoLabel}
                        >
                            Pelúcias
                        </Text>

                        <Text
                            style={styles.resumoValor}
                        >
                            {totalPelucias}
                        </Text>
                    </View>

                    <View
                        style={styles.resumoColuna}
                    >
                        <Text
                            style={styles.resumoLabel}
                        >
                            Carrinho
                        </Text>

                        <Text
                            style={styles.resumoValor}
                        >
                            {totalCarrinho}
                        </Text>
                    </View>

                    <View
                        style={styles.resumoColuna}
                    >
                        <Text
                            style={styles.resumoLabel}
                        >
                            Total
                        </Text>

                        <Text
                            style={styles.resumoValor}
                        >
                            {
                                totalPelucias +
                                totalCarrinho
                            }
                        </Text>
                    </View>

                </View>

                {renderPelucias()}

                {renderCarrinho()}

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
            fontSize: 30,
            fontWeight: "800"
        },

        subtitulo: {
            color: "#666666",
            marginTop: 4,
            marginBottom: 22
        },

        seletor: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 20
        },

        botaoPessoa: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 12,
            padding: 13,
            alignItems: "center"
        },

        botaoSelecionado: {
            backgroundColor: "#111111",
            borderColor: "#111111"
        },

        textoPessoa: {
            fontWeight: "700"
        },

        textoSelecionado: {
            color: "#FFFFFF"
        },

        resumo: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 28,
            flexDirection: "row"
        },

        resumoColuna: {
            flex: 1
        },

        resumoLabel: {
            color: "#777777",
            fontSize: 12
        },

        resumoValor: {
            fontSize: 24,
            fontWeight: "800",
            marginTop: 3
        },

        grupo: {
            marginBottom: 28
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

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10
        },

        produtoNome: {
            fontSize: 18,
            fontWeight: "800",
            marginBottom: 14
        },

        numeros: {
            flexDirection: "row"
        },

        numeroColuna: {
            flex: 1
        },

        numeroLabel: {
            fontSize: 12,
            color: "#777777"
        },

        numeroValor: {
            fontSize: 21,
            fontWeight: "700",
            marginTop: 3
        },

        insumoLinha: {
            marginBottom: 4
        },

        alocacao: {
            borderTopWidth: 1,
            borderTopColor: "#EEEEEE",
            marginTop: 14,
            paddingTop: 12
        },

        alocacaoTitulo: {
            fontSize: 13,
            color: "#666666",
            marginBottom: 8
        },

        alocacaoLinha: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5
        },

        alocacaoValor: {
            fontWeight: "700"
        },

        botaoDevolver: {
            marginTop: 14,
            borderWidth: 1,
            borderColor: "#CCCCCC",
            borderRadius: 10,
            padding: 11,
            alignItems: "center"
        },

        botaoDevolverTexto: {
            fontWeight: "700"
        },

        vazioGrupo: {
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 18
        },

        vazioTexto: {
            color: "#666666"
        }
    });
