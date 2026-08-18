import React, { useState } from "react";

import { useApp } from "../context/AppContext";
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
    const [responsavel, setResponsavel] = useState<UsuarioId>(UsuarioId.RODRIGO);
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
            onChangeResponsible={setResponsavel}
        />
    );
}
