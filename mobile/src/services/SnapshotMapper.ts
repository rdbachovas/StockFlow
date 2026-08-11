import { SnapshotDto } from "../dtos/SnapshotDto";
import { DadosIniciais } from "../data/AppData";
import { DestinoReservaId } from "../models/DestinoReserva";
import { LocalId } from "../models/Local";
import { MaquinaId } from "../models/Maquina";
import { ProdutoId } from "../models/Produto";
import { StatusReserva, TipoEventoReserva } from "../models/Reserva";
import { TipoMovimentoEstoquePrincipal } from "../models/MovimentoEstoquePrincipal";

function objeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === "object" && valor !== null;
}

function lista(valor: unknown): valor is unknown[] {
    return Array.isArray(valor);
}

function data(valor: string): Date {
    const resultado = new Date(valor);

    if (Number.isNaN(resultado.getTime())) {
        throw new Error("Snapshot contém data inválida.");
    }

    return resultado;
}

function validar(snapshot: unknown): asserts snapshot is SnapshotDto {
    if (!objeto(snapshot)) {
        throw new Error("Snapshot inválido.");
    }

    const colecoes = [
        "estoques",
        "reservas",
        "retiradas",
        "abastecimentos",
        "devolucoes",
        "movimentosEstoquePrincipal",
        "consumosCarrinho"
    ];

    if (!colecoes.every((chave) => lista(snapshot[chave]))) {
        throw new Error("Snapshot inválido.");
    }
}

export class SnapshotMapper {
    static paraDadosIniciais(valor: unknown): DadosIniciais {
        validar(valor);

        const estoquePrincipal = valor.estoques.find((estoque) => estoque.id === "ESTOQUE_PRINCIPAL");
        const estoqueRodrigo = valor.estoques.find((estoque) => estoque.responsavelId === "RODRIGO");
        const estoqueCesar = valor.estoques.find((estoque) => estoque.responsavelId === "CESAR");

        if (!estoquePrincipal || !estoqueRodrigo || !estoqueCesar) {
            throw new Error("Snapshot não contém os três estoques.");
        }

        const mapearEstoque = (estoque: typeof estoquePrincipal) => ({
            id: estoque.id,
            nome: estoque.nome,
            responsavelId: estoque.responsavelId ?? undefined,
            itens: estoque.itens.map((item) => ({
                produtoId: item.produtoId as ProdutoId,
                quantidade: item.quantidade
            }))
        });

        return {
            estoquePrincipal: mapearEstoque(estoquePrincipal),
            estoqueRodrigo: mapearEstoque(estoqueRodrigo),
            estoqueCesar: mapearEstoque(estoqueCesar),
            reservas: valor.reservas.map((reserva) => ({
                id: reserva.id,
                responsavelId: reserva.responsavelId,
                destinoId: reserva.destino as DestinoReservaId,
                produtoId: reserva.produtoId as ProdutoId,
                quantidade: reserva.quantidade,
                quantidadeUtilizada: reserva.quantidadeUtilizada,
                quantidadeLiberada: reserva.quantidadeLiberada,
                status: reserva.status as StatusReserva,
                dataCriacao: data(reserva.dataCriacao),
                historico: reserva.eventos.map((evento) => ({
                    id: evento.id,
                    tipo: evento.tipo as TipoEventoReserva,
                    quantidade: evento.quantidade,
                    data: data(evento.data)
                }))
            })),
            retiradas: valor.retiradas.map((retirada) => ({
                ...retirada,
                itens: retirada.itens.map((item) => ({
                    ...item,
                    produtoId: item.produtoId as ProdutoId
                })),
                observacao: retirada.observacao ?? undefined,
                data: data(retirada.data)
            })),
            abastecimentos: valor.abastecimentos.map((abastecimento) => ({
                id: abastecimento.id,
                localId: abastecimento.local as LocalId,
                responsavelId: abastecimento.responsavelId,
                itens: abastecimento.itens.map((item) => ({
                    ...item,
                    maquinaId: item.maquinaId as MaquinaId,
                    produtoId: item.produtoId as ProdutoId
                })),
                saldos: abastecimento.saldos.map((saldo) => ({
                    ...saldo,
                    produtoId: saldo.produtoId as ProdutoId
                })),
                data: data(abastecimento.data),
                observacao: abastecimento.observacao ?? undefined
            })),
            devolucoes: valor.devolucoes.map((devolucao) => ({
                ...devolucao,
                itens: devolucao.itens.map((item) => ({
                    ...item,
                    produtoId: item.produtoId as ProdutoId,
                    reservas: item.reservas.map((reserva) => ({
                        reservaId: reserva.reservaId,
                        destinoId: reserva.destino as DestinoReservaId,
                        quantidade: reserva.quantidade
                    }))
                })),
                data: data(devolucao.data),
                observacao: devolucao.observacao ?? undefined
            })),
            movimentosEstoquePrincipal: valor.movimentosEstoquePrincipal.map((movimento) => ({
                ...movimento,
                tipo: movimento.tipo as TipoMovimentoEstoquePrincipal,
                responsavelId: "ESTOQUE_PRINCIPAL",
                itens: movimento.itens.map((item) => ({
                    ...item,
                    produtoId: item.produtoId as ProdutoId
                })),
                data: data(movimento.data),
                observacao: movimento.observacao ?? undefined
            })),
            consumosCarrinho: valor.consumosCarrinho.map((consumo) => ({
                ...consumo,
                itens: consumo.itens.map((item) => ({
                    ...item,
                    produtoId: item.produtoId as ProdutoId
                })),
                data: data(consumo.data),
                observacao: consumo.observacao ?? undefined
            }))
        };
    }
}
