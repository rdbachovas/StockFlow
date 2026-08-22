import React from "react";

import { useLocalSearchParams } from "expo-router";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";
import { DevolucaoEstoqueScreen } from "../screens/DevolucaoEstoqueScreen";

export default function ReturnPage() {
    const { produtoId } = useLocalSearchParams<{
        responsavelId?: string;
        produtoId?: string;
    }>();
    const {
        estoquePrincipal,
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        registrarDevolucao
    } = useApp();
    const { usuario } = useAuth();

    return (
        <DevolucaoEstoqueScreen
            responsavelInicial={usuario!.id}
            produtoInicial={produtoId as ProdutoId | undefined}
            estoqueRodrigo={estoqueRodrigo}
            estoqueCesar={estoqueCesar}
            estoquePrincipal={estoquePrincipal}
            reservas={reservas}
            registrarDevolucao={registrarDevolucao}
        />
    );
}
