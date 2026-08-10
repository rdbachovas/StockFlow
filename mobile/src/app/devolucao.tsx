import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    useLocalSearchParams
} from "expo-router";

import { useApp } from "../context/AppContext";

import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";

import {
    DevolucaoEstoqueScreen
} from "../screens/DevolucaoEstoqueScreen";

export default function DevolucaoPage() {

    const {
        responsavelId,
        produtoId
    } = useLocalSearchParams<{
        responsavelId: string;
        produtoId: string;
    }>();

    const {
        estoquePrincipal,
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        registrarDevolucao
    } = useApp();

    const responsavel =
        responsavelId as
            UsuarioId;

    const produto =
        produtoId as
            ProdutoId;

    const estoquePessoal =
        responsavel ===
            UsuarioId.RODRIGO
            ? estoqueRodrigo
            : responsavel ===
                UsuarioId.CESAR
                ? estoqueCesar
                : undefined;

    if (
        !estoquePessoal ||
        !produto
    ) {

        return (
            <View
                style={styles.container}
            >
                <Text>
                    Dados da devolução inválidos.
                </Text>
            </View>
        );
    }

    return (
        <DevolucaoEstoqueScreen

            responsavelId={
                responsavel
            }

            produtoId={
                produto
            }

            estoquePessoal={
                estoquePessoal
            }

            estoquePrincipal={
                estoquePrincipal
            }

            reservas={
                reservas
            }

            registrarDevolucao={
                registrarDevolucao
            }

        />
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center"
        }
    });
