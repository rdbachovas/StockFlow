import React from "react";

import { useLocalSearchParams } from "expo-router";

import { useApp } from "../context/AppContext";
import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";
import { DevolucaoEstoqueScreen } from "../screens/DevolucaoEstoqueScreen";

export default function ReturnPage() {
    const { responsavelId, produtoId } = useLocalSearchParams<{
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

    return (
        <DevolucaoEstoqueScreen
            responsavelInicial={responsavelId === UsuarioId.CESAR ? UsuarioId.CESAR : UsuarioId.RODRIGO}
            produtoInicial={produtoId as ProdutoId | undefined}
            estoqueRodrigo={estoqueRodrigo}
            estoqueCesar={estoqueCesar}
            estoquePrincipal={estoquePrincipal}
            reservas={reservas}
            registrarDevolucao={registrarDevolucao}
        />
    );
}
