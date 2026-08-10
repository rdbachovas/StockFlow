import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    useLocalSearchParams
} from "expo-router";

import {
    AbastecimentoLocalScreen
} from "../screens/AbastecimentoLocalScreen";

import {
    AbastecimentoMercadoScreen
} from "../screens/AbastecimentoMercadoScreen";

import {
    useApp
} from "../context/AppContext";

import {
    LocalId
} from "../models/Local";

import {
    UsuarioId
} from "../models/Usuario";

const locaisMercados: LocalId[] = [

    LocalId.GAUCHO_VICENTE_FONTOURA,

    LocalId.SUPERMAGO_IPIRANGA,

    LocalId.GAUCHO_ANTONIO_CARVALHO,

    LocalId.SUPERMERCADO_FANTE,

    LocalId.SUPERMAGO_PLANALTO,

    LocalId.SAMS_CLUB,

    LocalId.SUPERMAGO_BOA_VISTA
];

export default function AbastecimentoPage() {

    const {
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        registrarAbastecimento
    } = useApp();

    const {
        localId
    } = useLocalSearchParams<{
        localId: string;
    }>();

    if (!localId) {

        return (
            <View
                style={styles.container}
            >
                <Text
                    style={styles.texto}
                >
                    Local não informado.
                </Text>
            </View>
        );
    }

    const local =
        localId as LocalId;

    // ==============================
    // BOULEVARD
    // Rodrigo
    // ==============================

    if (
        local ===
        LocalId.BOULEVARD
    ) {

        return (
            <AbastecimentoLocalScreen

                localId={
                    LocalId.BOULEVARD
                }

                responsavelId={
                    UsuarioId.RODRIGO
                }

                estoque={
                    estoqueRodrigo
                }

                reservas={
                    reservas
                }

                registrarAbastecimento={
                    registrarAbastecimento
                }

            />
        );
    }

    // ==============================
    // AEROPORTO
    // Cesar
    // ==============================

    if (
        local ===
        LocalId.AEROPORTO
    ) {

        return (
            <AbastecimentoLocalScreen

                localId={
                    LocalId.AEROPORTO
                }

                responsavelId={
                    UsuarioId.CESAR
                }

                estoque={
                    estoqueCesar
                }

                reservas={
                    reservas
                }

                registrarAbastecimento={
                    registrarAbastecimento
                }

            />
        );
    }

    // ==============================
    // MERCADOS
    // Rodrigo OU Cesar
    // ==============================

    if (
        locaisMercados.includes(
            local
        )
    ) {

        return (
            <AbastecimentoMercadoScreen
                localId={
                    local
                }
            />
        );
    }

    return (
        <View
            style={styles.container}
        >

            <Text
                style={styles.texto}
            >
                Local ainda não configurado.
            </Text>

        </View>
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 30
        },

        texto: {
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center"
        }
    });
