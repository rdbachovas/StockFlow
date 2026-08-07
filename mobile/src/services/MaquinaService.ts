import { Maquina } from "../models/Maquina";
import { MaquinaId } from "../models/Maquina";
import { CategoriaPelucia } from "../models/Produto";
import { LocalId } from "../models/Local";

const maquinas: Maquina[] = [
    {
        id: MaquinaId.B01,
        nome: "B01",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.STITCH],
    },
    {
        id: MaquinaId.B02,
        nome: "B02",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.CAPIVARAS],
    },
    {
        id: MaquinaId.B03,
        nome: "B03",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.PERSONAGENS],
    },
    {
        id: MaquinaId.GRANDE_DIREITA,
        nome: "Grande Direita",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.BIG],
    },
    {
        id: MaquinaId.GRANDE_ESQUERDA,
        nome: "Grande Esquerda",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.BIG],
    },
    {
        id: MaquinaId.B06,
        nome: "B06",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.MIX],
    },
    {
        id: MaquinaId.B07,
        nome: "B07",
        localId: LocalId.AEROPORTO,
        categoriasPermitidas: [CategoriaPelucia.LABUBU],
    },

    {
        id: MaquinaId.M1,
        nome: "M1",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS,
        ],
    },
    {
        id: MaquinaId.M2,
        nome: "M2",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS,
        ],
    },
    {
        id: MaquinaId.M3,
        nome: "M3",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [
            CategoriaPelucia.MIX,
            CategoriaPelucia.PERSONAGENS,
        ],
    },
    {
        id: MaquinaId.M4,
        nome: "M4",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [CategoriaPelucia.CAPIVARAS],
    },
    {
        id: MaquinaId.M5,
        nome: "M5",
        localId: LocalId.BOULEVARD,
        categoriasPermitidas: [CategoriaPelucia.BIG],
    },
];

export class MaquinaService {

    static buscarPorId(id: MaquinaId): Maquina | undefined {
        return maquinas.find((maquina) => maquina.id === id);
    }

    static podeReceber(
        maquina: Maquina,
        categoria: CategoriaPelucia
    ): boolean {
        return maquina.categoriasPermitidas.includes(categoria);
    }

    static podeReceberPorId(
        maquinaId: MaquinaId,
        categoria: CategoriaPelucia
    ): boolean {
        const maquina = this.buscarPorId(maquinaId);

        if (!maquina) {
            return false;
        }

        return this.podeReceber(maquina, categoria);
    }
}
