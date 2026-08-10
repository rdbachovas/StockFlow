import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { Reserva } from "../models/Reserva";

import { EstoqueService } from "./EstoqueService";
import { ReservaService } from "./ReservaService";

export class DevolucaoEstoqueService {

    static registrar(
        estoquePessoal: Estoque,
        estoquePrincipal: Estoque,
        reservas: Reserva[],
        devolucoes: DevolucaoEstoque[],
        devolucao: DevolucaoEstoque
    ): void {

        if (
            !estoquePessoal.responsavelId
        ) {
            throw new Error(
                "A origem precisa ser um estoque pessoal."
            );
        }

        if (
            estoquePessoal.responsavelId !==
            devolucao.responsavelId
        ) {
            throw new Error(
                "O responsável não corresponde ao estoque pessoal."
            );
        }

        if (
            devolucao.estoqueOrigemId !==
            estoquePessoal.id
        ) {
            throw new Error(
                "Estoque de origem inválido."
            );
        }

        if (
            devolucao.estoqueDestinoId !==
            estoquePrincipal.id
        ) {
            throw new Error(
                "Estoque principal inválido."
            );
        }

        if (
            devolucao.itens.length ===
            0
        ) {
            throw new Error(
                "Informe pelo menos um produto."
            );
        }

        const produtos =
            new Set<ProdutoId>();

        for (
            const item
            of devolucao.itens
        ) {

            if (
                produtos.has(
                    item.produtoId
                )
            ) {
                throw new Error(
                    `${item.produtoId} foi informado mais de uma vez.`
                );
            }

            produtos.add(
                item.produtoId
            );

            if (
                item.quantidadeLivre < 0
            ) {
                throw new Error(
                    "Quantidade livre inválida."
                );
            }

            const livreDisponivel =
                ReservaService
                    .quantidadeDisponivel(
                        estoquePessoal,
                        reservas,
                        item.produtoId
                    );

            if (
                item.quantidadeLivre >
                livreDisponivel
            ) {
                throw new Error(
                    `Você possui apenas ${livreDisponivel} ${item.produtoId} livres.`
                );
            }

            const destinos =
                new Set<string>();

            let totalReservado =
                0;

            for (
                const parcela
                of item.reservas
            ) {

                if (
                    parcela.quantidade <= 0
                ) {
                    throw new Error(
                        "Quantidade reservada inválida."
                    );
                }

                if (
                    destinos.has(
                        parcela.destinoId
                    )
                ) {
                    throw new Error(
                        "Um destino de reserva foi informado mais de uma vez."
                    );
                }

                destinos.add(
                    parcela.destinoId
                );

                const reservadoDestino =
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            item.produtoId,
                            devolucao.responsavelId,
                            parcela.destinoId
                        );

                if (
                    parcela.quantidade >
                    reservadoDestino
                ) {
                    throw new Error(
                        `Existem apenas ${reservadoDestino} ${item.produtoId} reservados para ${parcela.destinoId}.`
                    );
                }

                totalReservado +=
                    parcela.quantidade;
            }

            const totalDevolucao =
                item.quantidadeLivre +
                totalReservado;

            if (
                totalDevolucao <= 0
            ) {
                throw new Error(
                    "A quantidade total da devolução deve ser maior que zero."
                );
            }

            const fisico =
                EstoqueService
                    .consultarQuantidade(
                        estoquePessoal,
                        item.produtoId
                    );

            if (
                totalDevolucao >
                fisico
            ) {
                throw new Error(
                    `Estoque físico insuficiente de ${item.produtoId}.`
                );
            }
        }

        for (
            const item
            of devolucao.itens
        ) {

            const reservado =
                item.reservas.reduce(
                    (total, parcela) =>
                        total +
                        parcela.quantidade,
                    0
                );

            const total =
                item.quantidadeLivre +
                reservado;

            EstoqueService.remover(
                estoquePessoal,
                item.produtoId,
                total
            );

            EstoqueService.adicionar(
                estoquePrincipal,
                item.produtoId,
                total
            );

            for (
                const parcela
                of item.reservas
            ) {

                ReservaService
                    .liberarReservasNoDestino(
                        reservas,
                        devolucao.responsavelId,
                        parcela.destinoId,
                        item.produtoId,
                        parcela.quantidade
                    );
            }
        }

        devolucoes.push(
            devolucao
        );
    }

    static calcularTotal(
        devolucao: DevolucaoEstoque
    ): number {

        return devolucao.itens.reduce(
            (total, item) => {

                const reservado =
                    item.reservas.reduce(
                        (
                            soma,
                            parcela
                        ) =>
                            soma +
                            parcela.quantidade,
                        0
                    );

                return (
                    total +
                    item.quantidadeLivre +
                    reservado
                );
            },
            0
        );
    }
}
