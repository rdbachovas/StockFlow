import { Abastecimento } from "../models/Abastecimento";
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { CategoriaPelucia } from "../models/Produto";
import { Reserva } from "../models/Reserva";
import { EstoqueService } from "./EstoqueService";
import { MaquinaService } from "./MaquinaService";
import { ReservaService } from "./ReservaService";

export class AbastecimentoService {

    static registrar(
        estoque: Estoque,
        reservas: Reserva[],
        abastecimentos: Abastecimento[],
        abastecimento: Abastecimento
    ): void {

        if (
            !estoque.responsavelId
        ) {
            throw new Error(
                "O abastecimento deve utilizar um estoque pessoal."
            );
        }

        if (
            estoque.responsavelId !==
            abastecimento.responsavelId
        ) {
            throw new Error(
                "O responsável pelo abastecimento não corresponde ao estoque pessoal."
            );
        }

        if (
            abastecimento.itens.length ===
            0
        ) {
            throw new Error(
                "Informe pelo menos um item para abastecer."
            );
        }

        const itensRegistrados =
            new Set<string>();

        const totaisPorProduto =
            new Map<
                ProdutoId,
                number
            >();

        for (
            const item
            of abastecimento.itens
        ) {

            if (
                item.quantidade <= 0
            ) {
                throw new Error(
                    "Todas as quantidades devem ser maiores que zero."
                );
            }

            const maquina =
                MaquinaService.buscarPorId(
                    item.maquinaId
                );

            if (!maquina) {
                throw new Error(
                    `Máquina ${item.maquinaId} não encontrada.`
                );
            }

            if (
                maquina.localId !==
                abastecimento.localId
            ) {
                throw new Error(
                    `A máquina ${item.maquinaId} não pertence ao local informado.`
                );
            }

            const categoria =
                this.produtoParaCategoria(
                    item.produtoId
                );

            if (!categoria) {
                throw new Error(
                    `${item.produtoId} não é uma categoria de pelúcia válida para abastecimento.`
                );
            }

            if (
                !MaquinaService.podeReceber(
                    maquina,
                    categoria
                )
            ) {
                throw new Error(
                    `A máquina ${maquina.nome} não aceita ${item.produtoId}.`
                );
            }

            const chave =
                `${item.maquinaId}_${item.produtoId}`;

            if (
                itensRegistrados.has(
                    chave
                )
            ) {
                throw new Error(
                    `O produto ${item.produtoId} foi informado mais de uma vez para a máquina ${item.maquinaId}.`
                );
            }

            itensRegistrados.add(
                chave
            );

            const totalAtual =
                totaisPorProduto.get(
                    item.produtoId
                ) ?? 0;

            totaisPorProduto.set(
                item.produtoId,
                totalAtual +
                item.quantidade
            );
        }

        const destinoReserva =
            ReservaService
                .destinoReservaDoLocal(
                    abastecimento.localId
                );

        for (
            const [
                produtoId,
                quantidadeNecessaria
            ]
            of totaisPorProduto
        ) {

            const quantidadeFisica =
                EstoqueService
                    .consultarQuantidade(
                        estoque,
                        produtoId
                    );

            const reservadoTotal =
                ReservaService
                    .quantidadeReservada(
                        reservas,
                        produtoId,
                        abastecimento.responsavelId
                    );

            const reservadoParaDestino =
                ReservaService
                    .quantidadeReservadaNoDestino(
                        reservas,
                        produtoId,
                        abastecimento.responsavelId,
                        destinoReserva
                    );

            const quantidadeLivre =
                Math.max(
                    quantidadeFisica -
                    reservadoTotal,
                    0
                );

            const quantidadePermitida =
                quantidadeLivre +
                reservadoParaDestino;

            if (
                quantidadeNecessaria >
                quantidadePermitida
            ) {

                throw new Error(
                    `Quantidade insuficiente de ${produtoId}. Disponível para este destino: ${quantidadePermitida}.`
                );
            }
        }

        for (
            const [
                produtoId,
                quantidade
            ]
            of totaisPorProduto
        ) {

            EstoqueService.remover(
                estoque,
                produtoId,
                quantidade
            );

            ReservaService
                .consumirReservasNoDestino(
                    reservas,
                    abastecimento.responsavelId,
                    destinoReserva,
                    produtoId,
                    quantidade
                );
        }

        abastecimentos.push(
            abastecimento
        );
    }

    static calcularTotal(
        abastecimento: Abastecimento
    ): number {

        return abastecimento.itens
            .reduce(
                (total, item) =>
                    total +
                    item.quantidade,
                0
            );
    }

    private static produtoParaCategoria(
        produtoId: ProdutoId
    ): CategoriaPelucia | null {

        switch (produtoId) {

            case ProdutoId.MIX:
                return CategoriaPelucia.MIX;

            case ProdutoId.PERSONAGENS:
                return CategoriaPelucia.PERSONAGENS;

            case ProdutoId.CAPIVARAS:
                return CategoriaPelucia.CAPIVARAS;

            case ProdutoId.BIG:
                return CategoriaPelucia.BIG;

            case ProdutoId.STITCH:
                return CategoriaPelucia.STITCH;

            case ProdutoId.POKEMON:
                return CategoriaPelucia.POKEMON;

            case ProdutoId.LABUBU:
                return CategoriaPelucia.LABUBU;

            default:
                return null;
        }
    }
}
