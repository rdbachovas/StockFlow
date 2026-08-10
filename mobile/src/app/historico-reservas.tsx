import React from "react";

import { useApp } from "../context/AppContext";

import {
    HistoricoReservasScreen
} from "../screens/HistoricoReservasScreen";

export default function HistoricoReservasPage() {

    const {
        reservas
    } = useApp();

    return (
        <HistoricoReservasScreen
            reservas={
                reservas
            }
        />
    );
}
