import React, {
    useState
} from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import {
    useApp
} from "../context/AppContext";

import {
    LocalId
} from "../models/Local";

import {
    UsuarioId
} from "../models/Usuario";

import {
    AbastecimentoLocalScreen
} from "./AbastecimentoLocalScreen";

interface Props {
    localId: LocalId;
}

export function AbastecimentoMercadoScreen({
    localId
}: Props) {

    const {
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        registrarAbastecimento
    } = useApp();

    const [
        responsavelSelecionado,
        setResponsavelSelecionado
    ] = useState<UsuarioId>(
        UsuarioId.RODRIGO
    );

    const estoqueSelecionado =
        responsavelSelecionado ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

    return (
        <View
            style={styles.container}
        >

            <View
                style={styles.seletorContainer}
            >

                <Text
                    style={styles.titulo}
                >
                    Quem está abastecendo?
                </Text>

                <View
                    style={styles.seletor}
                >

                    <TouchableOpacity
                        style={[
                            styles.opcao,

                            responsavelSelecionado ===
                                UsuarioId.RODRIGO &&
                            styles.opcaoSelecionada
                        ]}
                        onPress={
                            () =>
                                setResponsavelSelecionado(
                                    UsuarioId.RODRIGO
                                )
                        }
                    >

                        <Text
                            style={[
                                styles.opcaoTexto,

                                responsavelSelecionado ===
                                    UsuarioId.RODRIGO &&
                                styles.opcaoTextoSelecionado
                            ]}
                        >
                            Rodrigo
                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.opcao,

                            responsavelSelecionado ===
                                UsuarioId.CESAR &&
                            styles.opcaoSelecionada
                        ]}
                        onPress={
                            () =>
                                setResponsavelSelecionado(
                                    UsuarioId.CESAR
                                )
                        }
                    >

                        <Text
                            style={[
                                styles.opcaoTexto,

                                responsavelSelecionado ===
                                    UsuarioId.CESAR &&
                                styles.opcaoTextoSelecionado
                            ]}
                        >
                            Cesar
                        </Text>

                    </TouchableOpacity>

                </View>

                <Text
                    style={styles.estoqueUsado}
                >
                    Usando: {
                        estoqueSelecionado.nome
                    }
                </Text>

            </View>

            <View
                style={styles.conteudo}
            >

                <AbastecimentoLocalScreen

                    key={
                        `${localId}-${responsavelSelecionado}`
                    }

                    localId={
                        localId
                    }

                    responsavelId={
                        responsavelSelecionado
                    }

                    estoque={
                        estoqueSelecionado
                    }

                    reservas={
                        reservas
                    }

                    registrarAbastecimento={
                        registrarAbastecimento
                    }

                />

            </View>

        </View>
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor: "#F5F5F5"
        },

        seletorContainer: {
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,

            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5"
        },

        titulo: {
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 10
        },

        seletor: {
            flexDirection: "row",
            gap: 10
        },

        opcao: {
            flex: 1,

            paddingVertical: 11,

            borderRadius: 10,

            alignItems: "center",

            backgroundColor: "#F5F5F5",

            borderWidth: 1,
            borderColor: "#DDDDDD"
        },

        opcaoSelecionada: {
            backgroundColor: "#111111",
            borderColor: "#111111"
        },

        opcaoTexto: {
            fontSize: 15,
            fontWeight: "700"
        },

        opcaoTextoSelecionado: {
            color: "#FFFFFF"
        },

        estoqueUsado: {
            marginTop: 10,
            fontSize: 13,
            color: "#666666"
        },

        conteudo: {
            flex: 1
        }
    });
