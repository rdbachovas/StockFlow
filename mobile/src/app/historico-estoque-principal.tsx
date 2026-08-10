import React from "react";

import { useApp } from "../context/AppContext";

import {
    HistoricoEstoquePrincipalScreen
} from "../screens/HistoricoEstoquePrincipalScreen";

export default function HistoricoEstoquePrincipalPage() {

    const {
        estoquePrincipal,
        movimentosEstoquePrincipal,
        retiradas,
        devolucoes
    } = useApp();

    return (
        <HistoricoEstoquePrincipalScreen

            estoquePrincipal={
                estoquePrincipal
            }

            movimentos={
                movimentosEstoquePrincipal
            }

            retiradas={
                retiradas
            }

            devolucoes={
                devolucoes
            }

        />
    );
}
