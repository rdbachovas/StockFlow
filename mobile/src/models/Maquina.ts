import { CategoriaPelucia } from "./Produto";
import { LocalId } from "./Local";

export enum MaquinaId {
    // Máquinas do Aeroporto
    B01 = "B01",
    B02 = "B02",
    B03 = "B03",
    GRANDE_ESQUERDA = "GRANDE_ESQUERDA",
    GRANDE_DIREITA = "GRANDE_DIREITA",
    B06 = "B06",
    B07 = "B07",

    // Máquinas do Boulevard
    M1 = "M1",
    M2 = "M2",
    M3 = "M3",
    M4 = "M4",
    M5 = "M5",

    // Máquinas dos mercados
    GAUCHO_VICENTE_FONTOURA = "GAUCHO_VICENTE_FONTOURA",
    SUPERMAGO_IPIRANGA = "SUPERMAGO_IPIRANGA",
    GAUCHO_ANTONIO_CARVALHO = "GAUCHO_ANTONIO_CARVALHO",
    SUPERMERCADO_FANTE = "SUPERMERCADO_FANTE",
    SUPERMAGO_PLANALTO = "SUPERMAGO_PLANALTO",
    SAMS_CLUB = "SAMS_CLUB",
    SUPERMAGO_BOA_VISTA = "SUPERMAGO_BOA_VISTA",
}

export interface Maquina {
    id: MaquinaId;
    nome: string;
    localId: LocalId;
    categoriasPermitidas: CategoriaPelucia[];
}