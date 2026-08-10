import {
    Maquina,
    MaquinaId
} from "../models/Maquina";

import {
    CategoriaPelucia
} from "../models/Produto";

import {
    LocalId
} from "../models/Local";

const maquinas: Maquina[] = [

    // ==============================
    // AEROPORTO
    // ==============================

    {
        id: MaquinaId.B01,
        nome: "B01",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.STITCH
        ]
    },

    {
        id: MaquinaId.B02,
        nome: "B02",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id: MaquinaId.B03,
        nome: "B03",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.PERSONAGENS
        ]
    },

    {
        id: MaquinaId.GRANDE_DIREITA,
        nome: "Grande Direita",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.BIG
        ]
    },

    {
        id: MaquinaId.GRANDE_ESQUERDA,
        nome: "Grande Esquerda",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.BIG
        ]
    },

    {
        id: MaquinaId.B06,
        nome: "B06",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.MIX
        ]
    },

    {
        id: MaquinaId.B07,
        nome: "B07",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [
            CategoriaPelucia.LABUBU
        ]
    },

    // ==============================
    // BOULEVARD
    // ==============================

    {
        id: MaquinaId.M1,
        nome: "M1",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS
        ]
    },

    {
        id: MaquinaId.M2,
        nome: "M2",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS
        ]
    },

    {
        id: MaquinaId.M3,
        nome: "M3",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS
        ]
    },

    {
        id: MaquinaId.M4,
        nome: "M4",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id: MaquinaId.M5,
        nome: "M5",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.BIG
        ]
    },

    // ==============================
    // MERCADOS
    // ==============================

    {
        id:
            MaquinaId.GAUCHO_VICENTE_FONTOURA,

        nome:
            "Gauchão Vicente da Fontoura",

        localId:
            LocalId.GAUCHO_VICENTE_FONTOURA,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.SUPERMAGO_IPIRANGA,

        nome:
            "SuperMago Ipiranga",

        localId:
            LocalId.SUPERMAGO_IPIRANGA,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.GAUCHO_ANTONIO_CARVALHO,

        nome:
            "Gauchão Antônio de Carvalho",

        localId:
            LocalId.GAUCHO_ANTONIO_CARVALHO,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.SUPERMERCADO_FANTE,

        nome:
            "Supermercado Fante",

        localId:
            LocalId.SUPERMERCADO_FANTE,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.SUPERMAGO_PLANALTO,

        nome:
            "SuperMago Planalto",

        localId:
            LocalId.SUPERMAGO_PLANALTO,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.SAMS_CLUB,

        nome:
            "Sam's Club",

        localId:
            LocalId.SAMS_CLUB,

        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.CAPIVARAS
        ]
    },

    {
        id:
            MaquinaId.SUPERMAGO_BOA_VISTA,

        nome:
            "SuperMago Boa Vista",

        localId:
            LocalId.SUPERMAGO_BOA_VISTA,

        categoriasPermitidas: [
            CategoriaPelucia.BIG
        ]
    }
];

export class MaquinaService {

    static buscarPorId(
        id: MaquinaId
    ): Maquina | undefined {

        return maquinas.find(
            (maquina) =>
                maquina.id === id
        );
    }

    static listarPorLocal(
        localId: LocalId
    ): Maquina[] {

        return maquinas.filter(
            (maquina) =>
                maquina.localId === localId
        );
    }

    static podeReceber(
        maquina: Maquina,
        categoria: CategoriaPelucia
    ): boolean {

        return maquina.categoriasPermitidas.includes(
            categoria
        );
    }

    static podeReceberPorId(
        maquinaId: MaquinaId,
        categoria: CategoriaPelucia
    ): boolean {

        const maquina =
            this.buscarPorId(
                maquinaId
            );

        if (!maquina) {
            return false;
        }

        return this.podeReceber(
            maquina,
            categoria
        );
    }
}
