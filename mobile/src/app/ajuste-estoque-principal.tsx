import React from "react";

import {
    useApp
} from "../context/AppContext";

import {
    MovimentoEstoquePrincipalScreen
} from "../screens/MovimentoEstoquePrincipalScreen";

export default function AjusteEstoquePrincipalPage() {

    const {
        estoquePrincipal,
        registrarMovimentoEstoquePrincipal
    } = useApp();

    return (
        <MovimentoEstoquePrincipalScreen

            estoquePrincipal={
                estoquePrincipal
            }

            registrarMovimento={
                registrarMovimentoEstoquePrincipal
            }

        />
    );
}
