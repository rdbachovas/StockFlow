import React, {
    useMemo,
    useState
} from "react";

import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { Abastecimento } from "../models/Abastecimento";
import { Estoque } from "../models/Estoque";
import { ItemAbastecimento } from "../models/ItemAbastecimento";
import { LocalId } from "../models/Local";

import {
    CategoriaPelucia,
    ProdutoId
} from "../models/Produto";

import { Reserva } from "../models/Reserva";

import { MaquinaService } from "../services/MaquinaService";
import { ReservaService } from "../services/ReservaService";

interface Props {
    localId: LocalId;

    responsavelId: string;

    estoque: Estoque;

    reservas: Reserva[];

    registrarAbastecimento:
        (
            abastecimento: Abastecimento
        ) => void;
}

function categoriaParaProduto(
    categoria: CategoriaPelucia
): ProdutoId {

    switch (categoria) {

        case CategoriaPelucia.MIX:
            return ProdutoId.MIX;

        case CategoriaPelucia.PERSONAGENS:
            return ProdutoId.PERSONAGENS;

        case CategoriaPelucia.CAPIVARAS:
            return ProdutoId.CAPIVARAS;

        case CategoriaPelucia.BIG:
            return ProdutoId.BIG;

        case CategoriaPelucia.STITCH:
            return ProdutoId.STITCH;

        case CategoriaPelucia.POKEMON:
            return ProdutoId.POKEMON;

        case CategoriaPelucia.LABUBU:
            return ProdutoId.LABUBU;
    }
}

export function AbastecimentoLocalScreen({
    localId,
    responsavelId,
    estoque,
    reservas,
    registrarAbastecimento
}: Props) {

    const maquinas =
        useMemo(
            () =>
                MaquinaService.listarPorLocal(
                    localId
                ),
            [localId]
        );

    const destinoReserva =
        useMemo(
            () =>
                ReservaService
                    .destinoReservaDoLocal(
                        localId
                    ),
            [localId]
        );

    const [
        quantidades,
        setQuantidades
    ] = useState<
        Record<string, string>
    >({});

    const [
        mensagemSucesso,
        setMensagemSucesso
    ] = useState<string | null>(
        null
    );

    const [
        mensagemErro,
        setMensagemErro
    ] = useState<string | null>(
        null
    );

    const categoriasDoLocal =
        useMemo(
            () => {

                const categorias =
                    new Set<
                        CategoriaPelucia
                    >();

                for (
                    const maquina
                    of maquinas
                ) {

                    for (
                        const categoria
                        of maquina.categoriasPermitidas
                    ) {

                        categorias.add(
                            categoria
                        );
                    }
                }

                return Array.from(
                    categorias
                );
            },
            [maquinas]
        );

    const estoquePorCategoria =
        useMemo(
            () => {

                return categoriasDoLocal.map(
                    (categoria) => {

                        const produtoId =
                            categoriaParaProduto(
                                categoria
                            );

                        const fisico =
                            estoque.itens.find(
                                (item) =>
                                    item.produtoId ===
                                    produtoId
                            )?.quantidade ?? 0;

                        const reservadoTotal =
                            ReservaService
                                .quantidadeReservada(
                                    reservas,
                                    produtoId,
                                    responsavelId
                                );

                        const reservadoDestino =
                            ReservaService
                                .quantidadeReservadaNoDestino(
                                    reservas,
                                    produtoId,
                                    responsavelId,
                                    destinoReserva
                                );

                        const livre =
                            ReservaService
                                .quantidadeDisponivel(
                                    estoque,
                                    reservas,
                                    produtoId
                                );

                        const podeUsarAqui =
                            livre +
                            reservadoDestino;

                        return {
                            categoria,
                            produtoId,
                            fisico,
                            reservadoTotal,
                            reservadoDestino,
                            livre,
                            podeUsarAqui
                        };
                    }
                );
            },
            [
                categoriasDoLocal,
                estoque,
                reservas,
                responsavelId,
                destinoReserva
            ]
        );

    const gerarChave = (
        maquinaId: string,
        categoria: CategoriaPelucia
    ): string => {

        return `${maquinaId}_${categoria}`;
    };

    const alterarQuantidade = (
        maquinaId: string,
        categoria: CategoriaPelucia,
        valor: string
    ) => {

        const somenteNumeros =
            valor.replace(
                /[^0-9]/g,
                ""
            );

        const chave =
            gerarChave(
                maquinaId,
                categoria
            );

        setMensagemSucesso(null);
        setMensagemErro(null);

        setQuantidades(
            (anterior) => ({
                ...anterior,
                [chave]:
                    somenteNumeros
            })
        );
    };

    const itensPreenchidos =
        useMemo(
            (): ItemAbastecimento[] => {

                const itens:
                    ItemAbastecimento[] = [];

                for (
                    const maquina
                    of maquinas
                ) {

                    for (
                        const categoria
                        of maquina.categoriasPermitidas
                    ) {

                        const chave =
                            gerarChave(
                                maquina.id,
                                categoria
                            );

                        const valor =
                            quantidades[
                                chave
                            ];

                        if (!valor) {
                            continue;
                        }

                        const quantidade =
                            Number(valor);

                        if (
                            !Number.isInteger(
                                quantidade
                            ) ||
                            quantidade <= 0
                        ) {
                            continue;
                        }

                        itens.push({
                            maquinaId:
                                maquina.id,

                            produtoId:
                                categoriaParaProduto(
                                    categoria
                                ),

                            quantidade
                        });
                    }
                }

                return itens;
            },
            [
                maquinas,
                quantidades
            ]
        );

    const total =
        useMemo(
            () =>
                itensPreenchidos.reduce(
                    (soma, item) =>
                        soma +
                        item.quantidade,
                    0
                ),
            [itensPreenchidos]
        );

    const totalPorProdutoDigitado =
        useMemo(
            () => {

                const totais =
                    new Map<
                        ProdutoId,
                        number
                    >();

                for (
                    const item
                    of itensPreenchidos
                ) {

                    const atual =
                        totais.get(
                            item.produtoId
                        ) ?? 0;

                    totais.set(
                        item.produtoId,
                        atual +
                        item.quantidade
                    );
                }

                return totais;
            },
            [itensPreenchidos]
        );

    const restanteParaDestino = (
        categoria: CategoriaPelucia
    ): number => {

        const produtoId =
            categoriaParaProduto(
                categoria
            );

        const informacao =
            estoquePorCategoria.find(
                (item) =>
                    item.produtoId ===
                    produtoId
            );

        const permitido =
            informacao
                ?.podeUsarAqui ?? 0;

        const digitado =
            totalPorProdutoDigitado.get(
                produtoId
            ) ?? 0;

        return (
            permitido -
            digitado
        );
    };

    const confirmarAbastecimento =
        () => {

            setMensagemErro(null);
            setMensagemSucesso(null);

            if (
                itensPreenchidos.length ===
                0
            ) {

                setMensagemErro(
                    "Informe pelo menos uma quantidade."
                );

                return;
            }

            const abastecimento:
                Abastecimento = {

                id:
                    `AB_${Date.now()}`,

                localId,

                responsavelId,

                itens:
                    itensPreenchidos,

                data:
                    new Date()
            };

            try {

                const totalRegistrado =
                    total;

                registrarAbastecimento(
                    abastecimento
                );

                setQuantidades({});

                setMensagemSucesso(
                    `${totalRegistrado} pelúcias registradas com sucesso.`
                );

            } catch (erro) {

                setMensagemErro(
                    erro instanceof Error
                        ? erro.message
                        : "Erro ao registrar abastecimento."
                );
            }
        };

    return (
        <KeyboardAvoidingView
            style={styles.container}

            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >

            <ScrollView
                contentContainerStyle={
                    styles.conteudo
                }
            >

                <Text
                    style={styles.titulo}
                >
                    Abastecimento
                </Text>

                <Text
                    style={styles.local}
                >
                    {localId}
                </Text>

                <Text
                    style={styles.secaoTitulo}
                >
                    Estoque para este abastecimento
                </Text>

                <View
                    style={styles.estoqueCategorias}
                >

                    {
                        estoquePorCategoria.map(
                            (item) => {

                                const restante =
                                    restanteParaDestino(
                                        item.categoria
                                    );

                                return (
                                    <View
                                        key={
                                            item.produtoId
                                        }
                                        style={
                                            styles.estoqueCategoria
                                        }
                                    >

                                        <Text
                                            style={styles.categoriaNome}
                                        >
                                            {item.categoria}
                                        </Text>

                                        <View
                                            style={styles.linhaResumo}
                                        >
                                            <Text style={styles.resumoLabel}>
                                                Físico
                                            </Text>

                                            <Text style={styles.resumoValor}>
                                                {item.fisico}
                                            </Text>
                                        </View>

                                        <View
                                            style={styles.linhaResumo}
                                        >
                                            <Text style={styles.resumoLabel}>
                                                Reservado para este destino
                                            </Text>

                                            <Text style={styles.resumoValor}>
                                                {item.reservadoDestino}
                                            </Text>
                                        </View>

                                        <View
                                            style={styles.linhaResumo}
                                        >
                                            <Text style={styles.resumoLabel}>
                                                Livre
                                            </Text>

                                            <Text style={styles.resumoValor}>
                                                {item.livre}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.linhaResumo,
                                                styles.linhaDestaque
                                            ]}
                                        >
                                            <Text style={styles.destaqueLabel}>
                                                Pode usar aqui
                                            </Text>

                                            <Text style={styles.destaqueValor}>
                                                {item.podeUsarAqui}
                                            </Text>
                                        </View>

                                        {
                                            restante !==
                                            item.podeUsarAqui
                                                ? (
                                                    <Text
                                                        style={[
                                                            styles.saldoProjetado,

                                                            restante < 0 &&
                                                            styles.saldoNegativo
                                                        ]}
                                                    >
                                                        Restante após preencher: {restante}
                                                    </Text>
                                                )
                                                : null
                                        }

                                    </View>
                                );
                            }
                        )
                    }

                </View>

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.maquinasTitulo
                    ]}
                >
                    Máquinas
                </Text>

                {
                    maquinas.map(
                        (maquina) => (

                            <View
                                key={
                                    maquina.id
                                }
                                style={
                                    styles.maquina
                                }
                            >

                                <Text
                                    style={styles.nomeMaquina}
                                >
                                    {maquina.nome}
                                </Text>

                                {
                                    maquina.categoriasPermitidas.map(
                                        (categoria) => {

                                            const chave =
                                                gerarChave(
                                                    maquina.id,
                                                    categoria
                                                );

                                            const restante =
                                                restanteParaDestino(
                                                    categoria
                                                );

                                            return (
                                                <View
                                                    key={
                                                        chave
                                                    }
                                                    style={
                                                        styles.linhaProduto
                                                    }
                                                >

                                                    <View
                                                        style={
                                                            styles.produtoInfo
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.nomeProduto
                                                            }
                                                        >
                                                            {categoria}
                                                        </Text>

                                                        <Text
                                                            style={[
                                                                styles.produtoDisponivel,

                                                                restante < 0 &&
                                                                styles.saldoNegativo
                                                            ]}
                                                        >
                                                            Restante para este destino: {restante}
                                                        </Text>
                                                    </View>

                                                    <TextInput
                                                        style={
                                                            styles.input
                                                        }

                                                        value={
                                                            quantidades[
                                                                chave
                                                            ] ?? ""
                                                        }

                                                        onChangeText={
                                                            (valor) =>
                                                                alterarQuantidade(
                                                                    maquina.id,
                                                                    categoria,
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
                        )
                    )
                }

                {
                    mensagemErro
                        ? (
                            <View style={styles.erro}>
                                <Text style={styles.erroTitulo}>
                                    Não foi possível registrar
                                </Text>

                                <Text style={styles.erroTexto}>
                                    {mensagemErro}
                                </Text>
                            </View>
                        )
                        : null
                }

                {
                    mensagemSucesso
                        ? (
                            <View style={styles.sucesso}>
                                <Text style={styles.sucessoTitulo}>
                                    ✓ Abastecimento registrado
                                </Text>

                                <Text style={styles.sucessoTexto}>
                                    {mensagemSucesso}
                                </Text>
                            </View>
                        )
                        : null
                }

                <View
                    style={styles.totalCard}
                >
                    <Text
                        style={styles.totalLabel}
                    >
                        Total do abastecimento
                    </Text>

                    <Text
                        style={styles.totalValor}
                    >
                        {total} pelúcias
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.botao}
                    onPress={
                        confirmarAbastecimento
                    }
                >
                    <Text
                        style={styles.textoBotao}
                    >
                        Confirmar abastecimento
                    </Text>
                </TouchableOpacity>

            </ScrollView>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F5F5F5"
    },

    conteudo: {
        padding: 20,
        paddingBottom: 50
    },

    titulo: {
        fontSize: 28,
        fontWeight: "800"
    },

    local: {
        fontSize: 18,
        color: "#666666",
        marginTop: 4,
        marginBottom: 24
    },

    secaoTitulo: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12
    },

    maquinasTitulo: {
        marginTop: 26
    },

    estoqueCategorias: {
        gap: 10
    },

    estoqueCategoria: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16
    },

    categoriaNome: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 12
    },

    linhaResumo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 7
    },

    resumoLabel: {
        color: "#666666",
        fontSize: 13
    },

    resumoValor: {
        fontSize: 14,
        fontWeight: "700"
    },

    linhaDestaque: {
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        marginTop: 5,
        paddingTop: 10
    },

    destaqueLabel: {
        fontSize: 14,
        fontWeight: "700"
    },

    destaqueValor: {
        fontSize: 20,
        fontWeight: "800"
    },

    saldoProjetado: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: "600",
        color: "#555555"
    },

    saldoNegativo: {
        color: "#B00020"
    },

    maquina: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 14,
        marginBottom: 14
    },

    nomeMaquina: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12
    },

    linhaProduto: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12
    },

    produtoInfo: {
        flex: 1,
        paddingRight: 12
    },

    nomeProduto: {
        fontSize: 16,
        fontWeight: "600"
    },

    produtoDisponivel: {
        fontSize: 12,
        color: "#666666",
        marginTop: 3
    },

    input: {
        width: 90,
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 18,
        textAlign: "center"
    },

    sucesso: {
        backgroundColor: "#E8F5E9",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },

    sucessoTitulo: {
        fontSize: 17,
        fontWeight: "700"
    },

    sucessoTexto: {
        fontSize: 15,
        marginTop: 4
    },

    erro: {
        backgroundColor: "#FFEBEE",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },

    erroTitulo: {
        fontSize: 17,
        fontWeight: "700"
    },

    erroTexto: {
        fontSize: 15,
        marginTop: 4
    },

    totalCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16
    },

    totalLabel: {
        fontSize: 16
    },

    totalValor: {
        fontSize: 26,
        fontWeight: "700",
        marginTop: 4
    },

    botao: {
        backgroundColor: "#111111",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },

    textoBotao: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700"
    }
});
