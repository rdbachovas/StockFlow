import { Abastecimento } from "../models/Abastecimento";
import { ConsumoCarrinho } from "../models/ConsumoCarrinho";
import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";
import { MovimentoEstoquePrincipal } from "../models/MovimentoEstoquePrincipal";
import { ProdutoId } from "../models/Produto";
import { Reserva } from "../models/Reserva";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";

export interface DadosIniciais {

    revisaoServidor: number;

    estoquePrincipal: Estoque;

    estoqueRodrigo: Estoque;

    estoqueCesar: Estoque;

    reservas: Reserva[];

    abastecimentos: Abastecimento[];

    retiradas: RetiradaEstoque[];

    devolucoes: DevolucaoEstoque[];

    movimentosEstoquePrincipal:
        MovimentoEstoquePrincipal[];

    consumosCarrinho:
        ConsumoCarrinho[];
}

export function criarDadosIniciais():
    DadosIniciais {

    return {

        revisaoServidor: 0,

        estoquePrincipal: {

            id:
                "ESTOQUE_PRINCIPAL",

            nome:
                "Estoque Principal",

            itens: [

                {
                    produtoId:
                        ProdutoId.MIX,
                    quantidade: 300
                },

                {
                    produtoId:
                        ProdutoId.PERSONAGENS,
                    quantidade: 200
                },

                {
                    produtoId:
                        ProdutoId.CAPIVARAS,
                    quantidade: 200
                },

                {
                    produtoId:
                        ProdutoId.BIG,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.STITCH,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.POKEMON,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.LABUBU,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.MILHO,
                    quantidade: 50
                },

                {
                    produtoId:
                        ProdutoId.CHOCOLATE,
                    quantidade: 50
                },

                {
                    produtoId:
                        ProdutoId.EMBALAGEM_CARRINHO_MEDIA,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.EMBALAGEM_CARRINHO_GRANDE,
                    quantidade: 100
                },

                {
                    produtoId:
                        ProdutoId.OLEO,
                    quantidade: 50
                }
            ]
        },

        estoqueRodrigo: {

            id:
                "ESTOQUE_RODRIGO",

            nome:
                "Estoque Rodrigo",

            responsavelId:
                UsuarioId.RODRIGO,

            itens: []
        },

        estoqueCesar: {

            id:
                "ESTOQUE_CESAR",

            nome:
                "Estoque Cesar",

            responsavelId:
                UsuarioId.CESAR,

            itens: []
        },

        reservas: [],

        abastecimentos: [],

        retiradas: [],

        devolucoes: [],

        movimentosEstoquePrincipal: [],

        consumosCarrinho: []
    };
}
