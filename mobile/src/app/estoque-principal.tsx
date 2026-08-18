import React from "react";

import { useApp } from "../context/AppContext";
import { EstoquePrincipalScreen } from "../screens/EstoquePrincipalScreen";

export default function MainStockPage() {
    const {
        estoquePrincipal,
        estoqueRodrigo,
        estoqueCesar,
        registrarRetirada
    } = useApp();

    return (
        <EstoquePrincipalScreen
            estoquePrincipal={estoquePrincipal}
            estoqueRodrigo={estoqueRodrigo}
            estoqueCesar={estoqueCesar}
            registrarRetirada={registrarRetirada}
        />
    );
}
