import React from "react";

import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { LocalId } from "../models/Local";
import { UsuarioId } from "../models/Usuario";
import { AbastecimentoLocalScreen } from "./AbastecimentoLocalScreen";

interface Props {
    localId: LocalId;
    localNome: string;
    onChangeLocal?: () => void;
}

export function AbastecimentoMercadoScreen({ localId, localNome, onChangeLocal }: Props) {
    const { estoqueRodrigo, estoqueCesar, reservas, registrarAbastecimento } = useApp();
    const { usuario } = useAuth();
    const responsavel = usuario!.id;
    const estoque = responsavel === UsuarioId.RODRIGO ? estoqueRodrigo : estoqueCesar;

    return (
        <AbastecimentoLocalScreen
            key={`${localId}-${responsavel}`}
            localId={localId}
            localNome={localNome}
            responsavelId={responsavel}
            estoque={estoque}
            reservas={reservas}
            registrarAbastecimento={registrarAbastecimento}
            onChangeLocal={onChangeLocal}
        />
    );
}
