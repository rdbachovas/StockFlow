import React from "react";

import {
    Stack
} from "expo-router";

import {
    AppProvider
} from "../context/AppContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

export default function RootLayout() {

    return (
        <AuthProvider>
            <AuthenticatedLayout />
        </AuthProvider>
    );
}

function AuthenticatedLayout() {
    const { estado } = useAuth();

    if (estado === "CARREGANDO") {
        return null;
    }

    if (estado === "NAO_AUTENTICADO") {
        return (
            <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack>
        );
    }

    return (
        <AppProvider>

            <Stack>

                <Stack.Screen
                    name="login"
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false
                    }}
                />

                <Stack.Screen
                    name="abastecimento"
                    options={{
                        title: "Abastecimento"
                    }}
                />

                <Stack.Screen
                    name="estoque-principal"
                    options={{
                        title: "Estoque Principal"
                    }}
                />

                <Stack.Screen
                    name="ajuste-estoque-principal"
                    options={{
                        title: "Atualizar Estoque Principal"
                    }}
                />

                <Stack.Screen
                    name="historico-estoque-principal"
                    options={{
                        title: "Histórico do Principal"
                    }}
                />

                <Stack.Screen
                    name="estoque-pessoal"
                    options={{
                        title: "Estoque Pessoal"
                    }}
                />

                <Stack.Screen
                    name="consumo-carrinho"
                    options={{
                        title: "Consumo do Carrinho"
                    }}
                />

                <Stack.Screen
                    name="reservas"
                    options={{
                        title: "Reservas"
                    }}
                />

                <Stack.Screen
                    name="historico-reservas"
                    options={{
                        title: "Histórico de Reservas"
                    }}
                />

                <Stack.Screen
                    name="devolucao"
                    options={{
                        title: "Devolução"
                    }}
                />

                <Stack.Screen
                    name="historico"
                    options={{
                        title: "Histórico"
                    }}
                />

                <Stack.Screen
                    name="historico-estoque-pessoal"
                    options={{
                        title: "Movimentações do Estoque"
                    }}
                />

                <Stack.Screen
                    name="sincronizacao"
                    options={{
                        title: "Sincronização"
                    }}
                />

            </Stack>

        </AppProvider>
    );
}
