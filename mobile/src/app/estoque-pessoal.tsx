import React from "react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { EstoquePessoalScreen } from "../screens/EstoquePessoalScreen";

export default function PersonalStockPage() {
    const { estoqueRodrigo, estoqueCesar, reservas } = useApp();
    const { usuario } = useAuth();

    return (
        <EstoquePessoalScreen
            estoqueRodrigo={estoqueRodrigo}
            estoqueCesar={estoqueCesar}
            reservas={reservas}
            responsavelInicial={usuario!.id}
        />
    );
}
