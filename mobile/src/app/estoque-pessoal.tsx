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
    useApp
} from "../context/AppContext";

import {
    EstoquePessoalScreen
} from "../screens/EstoquePessoalScreen";

export default function EstoquePessoalPage() {

    const {
        estoqueRodrigo,
        estoqueCesar,
        reservas
    } = useApp();

    return (
        <View
            style={styles.container}
        >

            <View
                style={styles.acoes}
            >

                <Link
                    href="/consumo-carrinho"
                    asChild
                >

                    <TouchableOpacity
                        style={styles.botao}
                    >

                        <Text
                            style={styles.botaoTexto}
                        >
                            🍿 Registrar consumo do carrinho
                        </Text>

                    </TouchableOpacity>

                </Link>

            </View>

            <View
                style={styles.conteudo}
            >

                <EstoquePessoalScreen

                    estoqueRodrigo={
                        estoqueRodrigo
                    }

                    estoqueCesar={
                        estoqueCesar
                    }

                    reservas={
                        reservas
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
            paddingTop: 12
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
            fontWeight: "700"
        },

        conteudo: {
            flex: 1
        }
    });
