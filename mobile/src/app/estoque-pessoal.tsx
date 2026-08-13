import React from "react";

import { useLocalSearchParams } from "expo-router";

import { useApp } from "../context/AppContext";
import { UsuarioId } from "../models/Usuario";
import { EstoquePessoalScreen } from "../screens/EstoquePessoalScreen";

export default function PersonalStockPage() {
    const { responsavelId } = useLocalSearchParams<{ responsavelId?: string }>();
    const { estoqueRodrigo, estoqueCesar, reservas } = useApp();

    const initialResponsible = responsavelId === UsuarioId.CESAR
        ? UsuarioId.CESAR
        : UsuarioId.RODRIGO;

    return (
        <EstoquePessoalScreen
            estoqueRodrigo={estoqueRodrigo}
            estoqueCesar={estoqueCesar}
            reservas={reservas}
            responsavelInicial={initialResponsible}
        />
    );
}
