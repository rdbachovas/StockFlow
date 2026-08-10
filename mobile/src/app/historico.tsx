import React from "react";

import {
    HistoricoScreen
} from "../screens/HistoricoScreen";

import {
    useApp
} from "../context/AppContext";

export default function HistoricoPage() {

    const {
        abastecimentos
    } = useApp();

    return (
        <HistoricoScreen
            abastecimentos={
                abastecimentos
            }
        />
    );
}
