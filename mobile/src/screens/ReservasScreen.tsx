import React, {
    useMemo,
    useState
} from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { useApp } from "../context/AppContext";

import {
    DestinoReservaId
} from "../models/DestinoReserva";

import { ProdutoId } from "../models/Produto";

import {
    Reserva,
    StatusReserva
} from "../models/Reserva";

import { UsuarioId } from "../models/Usuario";

import {
    ReservaService
} from "../services/ReservaService";

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

function descricaoDestino(
    destinoId: DestinoReservaId
): string {

    switch (destinoId) {

        case DestinoReservaId.BOULEVARD:
            return "Máquinas do Boulevard";

        case DestinoReservaId.AEROPORTO:
            return "Máquinas do Aeroporto";

        case DestinoReservaId.MERCADOS:
            return "Reserva compartilhada entre os 6 mercados MIX/Capivaras";

        case DestinoReservaId.SUPERMAGO_BOA_VISTA:
            return "Máquina BIG do Boa Vista";
    }
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

export function ReservasScreen() {

    const {
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        criarReserva,
        cancelarReserva
    } = useApp();

    const [
        responsavel,
        setResponsavel
    ] = useState<UsuarioId>(
        UsuarioId.RODRIGO
    );

    const [
        destinoSelecionado,
        setDestinoSelecionado
    ] = useState<DestinoReservaId>(
        DestinoReservaId.BOULEVARD
    );

    const [
        produtoSelecionado,
        setProdutoSelecionado
    ] = useState<ProdutoId>(
        ProdutoId.MIX
    );

    const [
        quantidade,
        setQuantidade
    ] = useState("");

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

    const estoque =
        responsavel ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

    const destinosPermitidos =
        useMemo(
            () =>
                ReservaService
                    .listarDestinosPermitidos(
                        responsavel
                    ),
            [responsavel]
        );

    const produtosPermitidos =
        useMemo(
            () =>
                ReservaService
                    .listarProdutosPermitidos(
                        destinoSelecionado
                    ),
            [destinoSelecionado]
        );

    const trocarResponsavel = (
        novoResponsavel: UsuarioId
    ) => {

        const destinos =
            ReservaService
                .listarDestinosPermitidos(
                    novoResponsavel
                );

        const primeiroDestino =
            destinos[0];

        const produtos =
            ReservaService
                .listarProdutosPermitidos(
                    primeiroDestino
                );

        setResponsavel(
            novoResponsavel
        );

        setDestinoSelecionado(
            primeiroDestino
        );

        setProdutoSelecionado(
            produtos[0]
        );

        setQuantidade("");
        setMensagemErro(null);
        setMensagemSucesso(null);
    };

    const trocarDestino = (
        destinoId: DestinoReservaId
    ) => {

        const produtos =
            ReservaService
                .listarProdutosPermitidos(
                    destinoId
                );

        setDestinoSelecionado(
            destinoId
        );

        setProdutoSelecionado(
            produtos[0]
        );

        setQuantidade("");
        setMensagemErro(null);
        setMensagemSucesso(null);
    };

    const quantidadeFisica =
        estoque.itens.find(
            (item) =>
                item.produtoId ===
                produtoSelecionado
        )?.quantidade ?? 0;

    const quantidadeReservadaTotal =
        ReservaService
            .quantidadeReservada(
                reservas,
                produtoSelecionado,
                responsavel
            );

    const quantidadeReservadaDestino =
        ReservaService
            .quantidadeReservadaNoDestino(
                reservas,
                produtoSelecionado,
                responsavel,
                destinoSelecionado
            );

    const quantidadeDisponivel =
        ReservaService
            .quantidadeDisponivel(
                estoque,
                reservas,
                produtoSelecionado
            );

    const reservasAtivas =
        reservas.filter(
            (reserva) =>
                reserva.responsavelId ===
                    responsavel &&
                reserva.status ===
                    StatusReserva.ATIVA
        );

    const confirmarReserva =
        () => {

            setMensagemErro(null);
            setMensagemSucesso(null);

            const valor =
                Number(
                    quantidade
                );

            if (
                !Number.isInteger(valor) ||
                valor <= 0
            ) {
                setMensagemErro(
                    "Informe uma quantidade válida."
                );

                return;
            }

            const reserva: Reserva = {

                id:
                    `RES_${Date.now()}`,

                responsavelId:
                    responsavel,

                destinoId:
                    destinoSelecionado,

                produtoId:
                    produtoSelecionado,

                quantidade:
                    valor,

                quantidadeUtilizada:
                    0,

                status:
                    StatusReserva.ATIVA
            };

            try {

                criarReserva(
                    reserva
                );

                setQuantidade("");

                setMensagemSucesso(
                    `${valor} ${nomeProduto(produtoSelecionado)} reservados para ${nomeDestino(destinoSelecionado)}.`
                );

            } catch (erro) {

                setMensagemErro(
                    erro instanceof Error
                        ? erro.message
                        : "Erro ao criar reserva."
                );
            }
        };

    const cancelar = (
        reserva: Reserva
    ) => {

        try {

            cancelarReserva(
                reserva.id,
                reserva.responsavelId
            );

            setMensagemErro(null);

            setMensagemSucesso(
                "Reserva cancelada. O restante voltou a ficar livre."
            );

        } catch (erro) {

            setMensagemErro(
                erro instanceof Error
                    ? erro.message
                    : "Erro ao cancelar reserva."
            );
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

                <Text style={styles.titulo}>
                    Reservas
                </Text>

                <Text style={styles.subtitulo}>
                    Separe parte do estoque pessoal para uma finalidade futura
                </Text>

                <Text style={styles.secaoTitulo}>
                    Responsável
                </Text>

                <View style={styles.seletor}>

                    {
                        [
                            UsuarioId.RODRIGO,
                            UsuarioId.CESAR
                        ].map(
                            (usuarioId) => (

                                <TouchableOpacity
                                    key={
                                        usuarioId
                                    }
                                    style={[
                                        styles.botaoPessoa,

                                        responsavel ===
                                            usuarioId &&
                                        styles.selecionado
                                    ]}
                                    onPress={
                                        () =>
                                            trocarResponsavel(
                                                usuarioId
                                            )
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.textoOpcao,

                                            responsavel ===
                                                usuarioId &&
                                            styles.textoSelecionado
                                        ]}
                                    >
                                        {
                                            usuarioId ===
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

                <Text style={styles.secaoTitulo}>
                    Destino da reserva
                </Text>

                <View style={styles.destinos}>

                    {
                        destinosPermitidos.map(
                            (destinoId) => (

                                <TouchableOpacity
                                    key={
                                        destinoId
                                    }
                                    style={[
                                        styles.cardDestino,

                                        destinoSelecionado ===
                                            destinoId &&
                                        styles.cardDestinoSelecionado
                                    ]}
                                    onPress={
                                        () =>
                                            trocarDestino(
                                                destinoId
                                            )
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.destinoNome,

                                            destinoSelecionado ===
                                                destinoId &&
                                            styles.textoSelecionado
                                        ]}
                                    >
                                        {
                                            nomeDestino(
                                                destinoId
                                            )
                                        }
                                    </Text>

                                    <Text
                                        style={[
                                            styles.destinoDescricao,

                                            destinoSelecionado ===
                                                destinoId &&
                                            styles.descricaoSelecionada
                                        ]}
                                    >
                                        {
                                            descricaoDestino(
                                                destinoId
                                            )
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )
                        )
                    }

                </View>

                <Text style={styles.secaoTitulo}>
                    Produto
                </Text>

                <View style={styles.produtos}>

                    {
                        produtosPermitidos.map(
                            (produtoId) => (

                                <TouchableOpacity
                                    key={
                                        produtoId
                                    }
                                    style={[
                                        styles.chip,

                                        produtoSelecionado ===
                                            produtoId &&
                                        styles.selecionado
                                    ]}
                                    onPress={
                                        () => {
                                            setProdutoSelecionado(
                                                produtoId
                                            );

                                            setQuantidade("");
                                            setMensagemErro(null);
                                            setMensagemSucesso(null);
                                        }
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.textoOpcao,

                                            produtoSelecionado ===
                                                produtoId &&
                                            styles.textoSelecionado
                                        ]}
                                    >
                                        {
                                            nomeProduto(
                                                produtoId
                                            )
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )
                        )
                    }

                </View>

                <View style={styles.resumo}>

                    <Text style={styles.resumoTitulo}>
                        {nomeProduto(produtoSelecionado)}
                    </Text>

                    <View style={styles.linha}>
                        <Text style={styles.label}>
                            Físico
                        </Text>

                        <Text style={styles.valor}>
                            {quantidadeFisica}
                        </Text>
                    </View>

                    <View style={styles.linha}>
                        <Text style={styles.label}>
                            Reservado total
                        </Text>

                        <Text style={styles.valor}>
                            {quantidadeReservadaTotal}
                        </Text>
                    </View>

                    <View style={styles.linha}>
                        <Text style={styles.label}>
                            Reservado para {nomeDestino(destinoSelecionado)}
                        </Text>

                        <Text style={styles.valor}>
                            {quantidadeReservadaDestino}
                        </Text>
                    </View>

                    <View style={styles.linhaDestaque}>
                        <Text style={styles.labelDestaque}>
                            Livre para novas reservas/usos
                        </Text>

                        <Text style={styles.valorDestaque}>
                            {quantidadeDisponivel}
                        </Text>
                    </View>

                </View>

                <Text style={styles.secaoTitulo}>
                    Quantidade
                </Text>

                <TextInput
                    style={styles.input}

                    value={
                        quantidade
                    }

                    onChangeText={
                        (valor) =>
                            setQuantidade(
                                valor.replace(
                                    /[^0-9]/g,
                                    ""
                                )
                            )
                    }

                    keyboardType="number-pad"

                    placeholder="0"
                />

                {
                    mensagemErro
                        ? (
                            <View style={styles.erro}>
                                <Text style={styles.mensagemTitulo}>
                                    Não foi possível criar
                                </Text>

                                <Text>
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
                                <Text style={styles.mensagemTitulo}>
                                    ✓ Reserva atualizada
                                </Text>

                                <Text>
                                    {mensagemSucesso}
                                </Text>
                            </View>
                        )
                        : null
                }

                <TouchableOpacity
                    style={styles.botaoCriar}
                    onPress={
                        confirmarReserva
                    }
                >
                    <Text style={styles.botaoCriarTexto}>
                        Criar reserva
                    </Text>
                </TouchableOpacity>

                <Text
                    style={[
                        styles.secaoTitulo,
                        styles.ativasTitulo
                    ]}
                >
                    Reservas ativas
                </Text>

                {
                    reservasAtivas.length ===
                    0
                        ? (
                            <View style={styles.vazio}>
                                <Text style={styles.vazioTexto}>
                                    Nenhuma reserva ativa.
                                </Text>
                            </View>
                        )
                        : reservasAtivas.map(
                            (reserva) => {

                                const restante =
                                    ReservaService
                                        .quantidadeRestante(
                                            reserva
                                        );

                                return (
                                    <View
                                        key={
                                            reserva.id
                                        }
                                        style={
                                            styles.cardReserva
                                        }
                                    >

                                        <Text style={styles.cardReservaDestino}>
                                            {
                                                nomeDestino(
                                                    reserva.destinoId
                                                )
                                            }
                                        </Text>

                                        <Text style={styles.cardReservaProduto}>
                                            {
                                                nomeProduto(
                                                    reserva.produtoId
                                                )
                                            }
                                        </Text>

                                        <View style={styles.cardLinha}>
                                            <Text>
                                                Reservado
                                            </Text>

                                            <Text style={styles.cardNumero}>
                                                {reserva.quantidade}
                                            </Text>
                                        </View>

                                        <View style={styles.cardLinha}>
                                            <Text>
                                                Utilizado
                                            </Text>

                                            <Text style={styles.cardNumero}>
                                                {reserva.quantidadeUtilizada}
                                            </Text>
                                        </View>

                                        <View style={styles.cardLinha}>
                                            <Text>
                                                Restante
                                            </Text>

                                            <Text style={styles.cardRestante}>
                                                {restante}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.cancelar}
                                            onPress={
                                                () =>
                                                    cancelar(
                                                        reserva
                                                    )
                                            }
                                        >
                                            <Text style={styles.cancelarTexto}>
                                                Cancelar reserva
                                            </Text>
                                        </TouchableOpacity>

                                    </View>
                                );
                            }
                        )
                }

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

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
        fontSize: 15,
        color: "#666666",
        marginTop: 4,
        marginBottom: 26
    },

    secaoTitulo: {
        fontSize: 19,
        fontWeight: "700",
        marginBottom: 12
    },

    seletor: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 24
    },

    botaoPessoa: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        padding: 13,
        alignItems: "center"
    },

    selecionado: {
        backgroundColor: "#111111",
        borderColor: "#111111"
    },

    textoOpcao: {
        fontSize: 14,
        fontWeight: "700"
    },

    textoSelecionado: {
        color: "#FFFFFF"
    },

    destinos: {
        gap: 9,
        marginBottom: 24
    },

    cardDestino: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDDDDD",
        borderRadius: 12,
        padding: 14
    },

    cardDestinoSelecionado: {
        backgroundColor: "#111111",
        borderColor: "#111111"
    },

    destinoNome: {
        fontSize: 16,
        fontWeight: "700"
    },

    destinoDescricao: {
        fontSize: 12,
        color: "#666666",
        marginTop: 4
    },

    descricaoSelecionada: {
        color: "#CCCCCC"
    },

    produtos: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24
    },

    chip: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        paddingHorizontal: 14,
        paddingVertical: 9
    },

    resumo: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        marginBottom: 24
    },

    resumoTitulo: {
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 14
    },

    linha: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 9
    },

    label: {
        color: "#666666"
    },

    valor: {
        fontWeight: "700"
    },

    linhaDestaque: {
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        marginTop: 4,
        paddingTop: 12,
        flexDirection: "row",
        justifyContent: "space-between"
    },

    labelDestaque: {
        fontWeight: "700",
        flex: 1
    },

    valorDestaque: {
        fontSize: 22,
        fontWeight: "800"
    },

    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CCCCCC",
        borderRadius: 12,
        padding: 14,
        fontSize: 20,
        marginBottom: 14
    },

    botaoCriar: {
        backgroundColor: "#111111",
        borderRadius: 12,
        padding: 16,
        alignItems: "center"
    },

    botaoCriarTexto: {
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

    mensagemTitulo: {
        fontWeight: "700",
        marginBottom: 4
    },

    ativasTitulo: {
        marginTop: 30
    },

    vazio: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 14
    },

    vazioTexto: {
        textAlign: "center",
        color: "#666666"
    },

    cardReserva: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12
    },

    cardReservaDestino: {
        fontSize: 18,
        fontWeight: "800"
    },

    cardReservaProduto: {
        color: "#666666",
        marginTop: 3,
        marginBottom: 14
    },

    cardLinha: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6
    },

    cardNumero: {
        fontWeight: "700"
    },

    cardRestante: {
        fontWeight: "800",
        fontSize: 18
    },

    cancelar: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        padding: 10,
        borderRadius: 10,
        alignItems: "center"
    },

    cancelarTexto: {
        fontWeight: "700"
    }
});
