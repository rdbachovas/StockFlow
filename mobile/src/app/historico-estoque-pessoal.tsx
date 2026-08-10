import React from "react";

import {
    useApp
} from "../context/AppContext";

import {
    HistoricoEstoquePessoalScreen
} from "../screens/HistoricoEstoquePessoalScreen";

export default function HistoricoEstoquePessoalPage() {

    const {
        retiradas,
        abastecimentos,
        devolucoes,
        consumosCarrinho
    } = useApp();

    return (
        <HistoricoEstoquePessoalScreen

            retiradas={
                retiradas
            }

            abastecimentos={
                abastecimentos
            }

            devolucoes={
                devolucoes
            }

            consumosCarrinho={
                consumosCarrinho
            }

        />
    );
}
