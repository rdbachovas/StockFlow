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
    ReservasScreen
} from "../screens/ReservasScreen";

export default function ReservasPage() {

    return (
        <View
            style={styles.container}
        >

            <View
                style={styles.acao}
            >

                <Link
                    href="/historico-reservas"
                    asChild
                >

                    <TouchableOpacity
                        style={styles.botao}
                    >

                        <Text
                            style={styles.botaoTexto}
                        >
                            Ver histórico de reservas
                        </Text>

                    </TouchableOpacity>

                </Link>

            </View>

            <View
                style={styles.conteudo}
            >
                <ReservasScreen />
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

        acao: {
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
