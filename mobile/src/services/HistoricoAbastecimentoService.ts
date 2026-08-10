import { Abastecimento } from "../models/Abastecimento";
import { ItemAbastecimento } from "../models/ItemAbastecimento";
import { LocalId } from "../models/Local";
import { MaquinaId } from "../models/Maquina";
import { ProdutoId } from "../models/Produto";

export interface ResumoMaquinaAbastecimento {
    maquinaId: MaquinaId;
    itens: ItemAbastecimento[];
    total: number;
}

export class HistoricoAbastecimentoService {

    static listarPorLocal(
        abastecimentos: Abastecimento[],
        localId: LocalId
    ): Abastecimento[] {

        return abastecimentos
            .filter(
                (abastecimento) =>
                    abastecimento.localId === localId
            )
            .sort(
                (a, b) =>
                    b.data.getTime() -
                    a.data.getTime()
            );
    }

    static buscarUltimoPorLocal(
        abastecimentos: Abastecimento[],
        localId: LocalId
    ): Abastecimento | undefined {

        return this.listarPorLocal(
            abastecimentos,
            localId
        )[0];
    }

    static calcularTotal(
        abastecimento: Abastecimento
    ): number {

        return abastecimento.itens.reduce(
            (total, item) =>
                total + item.quantidade,
            0
        );
    }

    static calcularTotaisPorProduto(
        abastecimento: Abastecimento
    ): Partial<Record<ProdutoId, number>> {

        const totais:
            Partial<Record<ProdutoId, number>> = {};

        for (const item of abastecimento.itens) {

            totais[item.produtoId] =
                (totais[item.produtoId] ?? 0) +
                item.quantidade;
        }

        return totais;
    }

    static resumirPorMaquina(
        abastecimento: Abastecimento
    ): ResumoMaquinaAbastecimento[] {

        const maquinas =
            new Map<
                MaquinaId,
                ItemAbastecimento[]
            >();

        for (const item of abastecimento.itens) {

            const itensDaMaquina =
                maquinas.get(item.maquinaId) ?? [];

            itensDaMaquina.push(item);

            maquinas.set(
                item.maquinaId,
                itensDaMaquina
            );
        }

        return Array.from(
            maquinas.entries()
        ).map(
            ([maquinaId, itens]) => ({
                maquinaId,

                itens,

                total: itens.reduce(
                    (total, item) =>
                        total +
                        item.quantidade,
                    0
                )
            })
        );
    }
}
