import React from "react";

import { useApp } from "../context/AppContext";

import {
    ConsumoCarrinhoScreen
} from "../screens/ConsumoCarrinhoScreen";

export default function ConsumoCarrinhoPage() {

    const {
        estoqueRodrigo,
        estoqueCesar,
        registrarConsumoCarrinho
    } = useApp();

    return (
        <ConsumoCarrinhoScreen

            estoqueRodrigo={
                estoqueRodrigo
            }

            estoqueCesar={
                estoqueCesar
            }

            registrarConsumo={
                registrarConsumoCarrinho
            }

        />
    );
}
