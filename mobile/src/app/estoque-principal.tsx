import React from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import {
    Link
} from "expo-router";

import {
    EstoquePrincipalScreen
} from "../screens/EstoquePrincipalScreen";

import {
    useApp
} from "../context/AppContext";

export default function EstoquePrincipalPage() {

    const {
        estoquePrincipal,
        estoqueRodrigo,
        estoqueCesar,
        registrarRetirada
    } = useApp();

    return (
        <View
            style={styles.container}
        >

            <View
                style={styles.acoes}
            >

                <Link
                    href="/ajuste-estoque-principal"
                    asChild
                >

                    <TouchableOpacity
                        style={styles.botao}
                    >
                        <Text
                            style={styles.botaoTexto}
                        >
                            + Entrada / Ajuste do estoque
                        </Text>
                    </TouchableOpacity>

                </Link>

                <Link
                    href="/historico-estoque-principal"
                    asChild
                >

                    <TouchableOpacity
                        style={styles.botao}
                    >
                        <Text
                            style={styles.botaoTexto}
                        >
                            Histórico completo do Principal
                        </Text>
                    </TouchableOpacity>

                </Link>

            </View>

            <View
                style={styles.conteudo}
            >

                <EstoquePrincipalScreen

                    estoquePrincipal={
                        estoquePrincipal
                    }

                    estoqueRodrigo={
                        estoqueRodrigo
                    }

                    estoqueCesar={
                        estoqueCesar
                    }

                    registrarRetirada={
                        registrarRetirada
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

        acoes: {
            paddingHorizontal: 20,
            paddingTop: 12,
            gap: 8
        },

        botao: {
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 12,
            padding: 13,
            alignItems: "center"
        },

        botaoTexto: {
            fontSize: 14,
            fontWeight: "700"
        },

        conteudo: {
            flex: 1
        }
    });
