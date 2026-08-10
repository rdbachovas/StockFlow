import {
    describe,
    expect,
    test
} from "@jest/globals";

import {
    Abastecimento
} from "../src/models/Abastecimento";

import {
    ConsumoCarrinho,
    SolicitacaoConsumoCarrinho
} from "../src/models/ConsumoCarrinho";

import {
    DestinoReservaId
} from "../src/models/DestinoReserva";

import {
    DevolucaoEstoque
} from "../src/models/DevolucaoEstoque";

import {
    Estoque
} from "../src/models/Estoque";

import {
    LocalId
} from "../src/models/Local";

import {
    MovimentoEstoquePrincipal,
    SolicitacaoMovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../src/models/MovimentoEstoquePrincipal";

import {
    ProdutoId
} from "../src/models/Produto";

import {
    Reserva,
    StatusReserva,
    TipoEventoReserva
} from "../src/models/Reserva";

import {
    RetiradaEstoque
} from "../src/models/RetiradaEstoque";

import {
    UsuarioId
} from "../src/models/Usuario";

import {
    AbastecimentoService
} from "../src/services/AbastecimentoService";

import {
    ConsumoCarrinhoService
} from "../src/services/ConsumoCarrinhoService";

import {
    DevolucaoEstoqueService
} from "../src/services/DevolucaoEstoqueService";

import {
    EstoqueService
} from "../src/services/EstoqueService";

import {
    MaquinaService
} from "../src/services/MaquinaService";

import {
    MovimentoEstoquePrincipalService
} from "../src/services/MovimentoEstoquePrincipalService";

import {
    ReservaService
} from "../src/services/ReservaService";

import {
    RetiradaEstoqueService
} from "../src/services/RetiradaEstoqueService";


let contador = 0;


function id(
    prefixo: string
): string {

    contador++;

    return `${prefixo}_${contador}`;
}


function criarEstoque(
    idEstoque: string,
    nome: string,
    responsavelId?: UsuarioId,
    itens: Array<
        [ProdutoId, number]
    > = []
): Estoque {

    return {
        id:
            idEstoque,

        nome,

        responsavelId,

        itens:
            itens.map(
                (
                    [
                        produtoId,
                        quantidade
                    ]
                ) => ({
                    produtoId,
                    quantidade
                })
            )
    };
}


function quantidade(
    estoque: Estoque,
    produtoId: ProdutoId
): number {

    return EstoqueService
        .consultarQuantidade(
            estoque,
            produtoId
        );
}


function criarReserva(
    produtoId: ProdutoId,
    quantidadeReserva: number,
    destinoId: DestinoReservaId
): Reserva {

    return {
        id:
            id("RES"),

        responsavelId:
            UsuarioId.RODRIGO,

        destinoId,

        produtoId,

        quantidade:
            quantidadeReserva,

        quantidadeUtilizada:
            0,

        quantidadeLiberada:
            0,

        status:
            StatusReserva.ATIVA
    };
}


describe(
    "Fluxo operacional completo do StockFlow",
    () => {

        test(
            "simula entrada, retiradas, reservas, abastecimentos, devolução e carrinho",
            () => {

                contador = 0;

                // =================================================
                // ESTADO INICIAL
                // =================================================

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Estoque Principal",
                        undefined,
                        [
                            [
                                ProdutoId.MIX,
                                300
                            ],
                            [
                                ProdutoId.CAPIVARAS,
                                200
                            ],
                            [
                                ProdutoId.MILHO,
                                50
                            ],
                            [
                                ProdutoId.OLEO,
                                20
                            ]
                        ]
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Estoque Rodrigo",
                        UsuarioId.RODRIGO
                    );

                const cesar =
                    criarEstoque(
                        "CESAR",
                        "Estoque Cesar",
                        UsuarioId.CESAR
                    );


                const movimentosPrincipal:
                    MovimentoEstoquePrincipal[] =
                    [];

                const retiradas:
                    RetiradaEstoque[] =
                    [];

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

                const consumos:
                    ConsumoCarrinho[] =
                    [];


                // =================================================
                // 1. CHEGOU MERCADORIA NOVA
                // =================================================

                const entradaFornecedor:
                    SolicitacaoMovimentoEstoquePrincipal = {

                    id:
                        id("MOV"),

                    tipo:
                        TipoMovimentoEstoquePrincipal.ENTRADA,

                    responsavelId:
                        UsuarioId.RODRIGO,

                    itens: [
                        {
                            produtoId:
                                ProdutoId.MIX,

                            quantidade:
                                200
                        },
                        {
                            produtoId:
                                ProdutoId.CAPIVARAS,

                            quantidade:
                                100
                        },
                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                30
                        },
                        {
                            produtoId:
                                ProdutoId.OLEO,

                            quantidade:
                                10
                        }
                    ],

                    data:
                        new Date(
                            "2026-08-03T09:00:00"
                        ),

                    observacao:
                        "Entrega semanal"
                };

                MovimentoEstoquePrincipalService
                    .registrar(
                        principal,
                        movimentosPrincipal,
                        entradaFornecedor
                    );


                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    500
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.CAPIVARAS
                    )
                ).toBe(
                    300
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    80
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.OLEO
                    )
                ).toBe(
                    30
                );


                // =================================================
                // 2. RODRIGO RETIRA PRODUTOS
                // =================================================

                RetiradaEstoqueService
                    .registrar(
                        principal,
                        rodrigo,
                        retiradas,
                        {

                            id:
                                id("RET"),

                            estoqueOrigemId:
                                principal.id,

                            estoqueDestinoId:
                                rodrigo.id,

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidade:
                                        100
                                },
                                {
                                    produtoId:
                                        ProdutoId.CAPIVARAS,

                                    quantidade:
                                        50
                                },
                                {
                                    produtoId:
                                        ProdutoId.MILHO,

                                    quantidade:
                                        10
                                },
                                {
                                    produtoId:
                                        ProdutoId.OLEO,

                                    quantidade:
                                        3
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-04T08:00:00"
                                )
                        }
                    );


                // =================================================
                // 3. CESAR TAMBÉM RETIRA PRODUTOS
                // =================================================

                RetiradaEstoqueService
                    .registrar(
                        principal,
                        cesar,
                        retiradas,
                        {

                            id:
                                id("RET"),

                            estoqueOrigemId:
                                principal.id,

                            estoqueDestinoId:
                                cesar.id,

                            responsavelId:
                                UsuarioId.CESAR,

                            itens: [
                                {
                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidade:
                                        40
                                },
                                {
                                    produtoId:
                                        ProdutoId.CAPIVARAS,

                                    quantidade:
                                        20
                                },
                                {
                                    produtoId:
                                        ProdutoId.MILHO,

                                    quantidade:
                                        8
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-04T09:00:00"
                                )
                        }
                    );


                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    100
                );

                expect(
                    quantidade(
                        cesar,
                        ProdutoId.MIX
                    )
                ).toBe(
                    40
                );


                // =================================================
                // 4. RODRIGO CRIA RESERVAS
                // =================================================

                const reservaMercadosMix =
                    criarReserva(
                        ProdutoId.MIX,
                        40,
                        DestinoReservaId.MERCADOS
                    );

                const reservaBoulevardMix =
                    criarReserva(
                        ProdutoId.MIX,
                        20,
                        DestinoReservaId.BOULEVARD
                    );

                const reservaMercadosCapivaras =
                    criarReserva(
                        ProdutoId.CAPIVARAS,
                        20,
                        DestinoReservaId.MERCADOS
                    );


                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reservaMercadosMix
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reservaBoulevardMix
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reservaMercadosCapivaras
                    );


                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    40
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.CAPIVARAS
                        )
                ).toBe(
                    30
                );


                // =================================================
                // 5. SAM'S CLUB
                // =================================================

                const maquinaSams =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];


                AbastecimentoService
                    .registrar(
                        rodrigo,
                        reservas,
                        abastecimentos,
                        {

                            id:
                                id("ABA"),

                            localId:
                                LocalId.SAMS_CLUB,

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    maquinaId:
                                        maquinaSams.id,

                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidade:
                                        15
                                },
                                {
                                    maquinaId:
                                        maquinaSams.id,

                                    produtoId:
                                        ProdutoId.CAPIVARAS,

                                    quantidade:
                                        8
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-05T08:00:00"
                                )
                        }
                    );


                // =================================================
                // 6. SUPERMAGO PLANALTO
                // =================================================

                const maquinaPlanalto =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SUPERMAGO_PLANALTO
                        )[0];


                AbastecimentoService
                    .registrar(
                        rodrigo,
                        reservas,
                        abastecimentos,
                        {

                            id:
                                id("ABA"),

                            localId:
                                LocalId.SUPERMAGO_PLANALTO,

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    maquinaId:
                                        maquinaPlanalto.id,

                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidade:
                                        10
                                },
                                {
                                    maquinaId:
                                        maquinaPlanalto.id,

                                    produtoId:
                                        ProdutoId.CAPIVARAS,

                                    quantidade:
                                        5
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-05T10:00:00"
                                )
                        }
                    );


                // =================================================
                // 7. BOULEVARD
                // =================================================

                const maquinaBoulevard =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.BOULEVARD
                        )[0];


                AbastecimentoService
                    .registrar(
                        rodrigo,
                        reservas,
                        abastecimentos,
                        {

                            id:
                                id("ABA"),

                            localId:
                                LocalId.BOULEVARD,

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    maquinaId:
                                        maquinaBoulevard.id,

                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidade:
                                        10
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-06T09:00:00"
                                )
                        }
                    );


                // =================================================
                // 8. DEVOLUÇÃO DE MIX
                //
                // 5 livres
                // 5 da reserva MERCADOS
                // =================================================

                DevolucaoEstoqueService
                    .registrar(
                        rodrigo,
                        principal,
                        reservas,
                        devolucoes,
                        {

                            id:
                                id("DEV"),

                            estoqueOrigemId:
                                rodrigo.id,

                            estoqueDestinoId:
                                principal.id,

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    produtoId:
                                        ProdutoId.MIX,

                                    quantidadeLivre:
                                        5,

                                    reservas: [
                                        {
                                            destinoId:
                                                DestinoReservaId.MERCADOS,

                                            quantidade:
                                                5
                                        }
                                    ]
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-07T09:00:00"
                                ),

                            observacao:
                                "Sobra da rota"
                        }
                    );


                // =================================================
                // 9. CONSUMO DOS INSUMOS
                // =================================================

                const consumoCarrinho:
                    SolicitacaoConsumoCarrinho = {

                    id:
                        id("CONS"),

                    responsavelId:
                        UsuarioId.RODRIGO,

                    itens: [
                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                3
                        },
                        {
                            produtoId:
                                ProdutoId.OLEO,

                            quantidade:
                                1
                        }
                    ],

                    data:
                        new Date(
                            "2026-08-08T18:00:00"
                        ),

                    observacao:
                        "Consumo do carrinho"
                };


                ConsumoCarrinhoService
                    .registrar(
                        rodrigo,
                        consumos,
                        consumoCarrinho
                    );


                // =================================================
                // 10. SALDOS FINAIS DO PRINCIPAL
                // =================================================

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    370
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.CAPIVARAS
                    )
                ).toBe(
                    230
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    62
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.OLEO
                    )
                ).toBe(
                    27
                );


                // =================================================
                // 11. SALDOS FINAIS RODRIGO
                // =================================================

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    55
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.CAPIVARAS
                    )
                ).toBe(
                    37
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    7
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.OLEO
                    )
                ).toBe(
                    2
                );


                // =================================================
                // 12. SALDOS FINAIS CESAR
                // =================================================

                expect(
                    quantidade(
                        cesar,
                        ProdutoId.MIX
                    )
                ).toBe(
                    40
                );

                expect(
                    quantidade(
                        cesar,
                        ProdutoId.CAPIVARAS
                    )
                ).toBe(
                    20
                );

                expect(
                    quantidade(
                        cesar,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    8
                );


                // =================================================
                // 13. RESERVAS FINAIS
                // =================================================

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    10
                );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.BOULEVARD
                        )
                ).toBe(
                    10
                );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.CAPIVARAS,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    7
                );


                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    35
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.CAPIVARAS
                        )
                ).toBe(
                    30
                );


                // =================================================
                // 14. HISTÓRICOS GERAIS
                // =================================================

                expect(
                    movimentosPrincipal
                ).toHaveLength(
                    1
                );

                expect(
                    retiradas
                ).toHaveLength(
                    2
                );

                expect(
                    abastecimentos
                ).toHaveLength(
                    3
                );

                expect(
                    devolucoes
                ).toHaveLength(
                    1
                );

                expect(
                    consumos
                ).toHaveLength(
                    1
                );

                expect(
                    reservas
                ).toHaveLength(
                    3
                );


                // =================================================
                // 15. HISTÓRICO DA RESERVA MIX → MERCADOS
                // =================================================

                expect(
                    reservaMercadosMix.quantidade
                ).toBe(
                    40
                );

                expect(
                    reservaMercadosMix.quantidadeUtilizada
                ).toBe(
                    25
                );

                expect(
                    reservaMercadosMix.quantidadeLiberada
                ).toBe(
                    5
                );

                expect(
                    ReservaService
                        .quantidadeRestante(
                            reservaMercadosMix
                        )
                ).toBe(
                    10
                );

                expect(
                    reservaMercadosMix.status
                ).toBe(
                    StatusReserva.ATIVA
                );


                const eventosMercadosMix =
                    reservaMercadosMix
                        .historico
                        ?.map(
                            (evento) =>
                                evento.tipo
                        ) ?? [];


                expect(
                    eventosMercadosMix
                ).toEqual(
                    [
                        TipoEventoReserva.CRIACAO,
                        TipoEventoReserva.UTILIZACAO,
                        TipoEventoReserva.UTILIZACAO,
                        TipoEventoReserva.LIBERACAO
                    ]
                );


                // =================================================
                // 16. RESERVA BOULEVARD
                // =================================================

                expect(
                    reservaBoulevardMix
                        .quantidadeUtilizada
                ).toBe(
                    10
                );

                expect(
                    ReservaService
                        .quantidadeRestante(
                            reservaBoulevardMix
                        )
                ).toBe(
                    10
                );


                // =================================================
                // 17. RESERVA CAPIVARAS
                // =================================================

                expect(
                    reservaMercadosCapivaras
                        .quantidadeUtilizada
                ).toBe(
                    13
                );

                expect(
                    ReservaService
                        .quantidadeRestante(
                            reservaMercadosCapivaras
                        )
                ).toBe(
                    7
                );


                // =================================================
                // 18. GARANTIAS FINAIS
                // =================================================

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBeGreaterThanOrEqual(
                    0
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBeGreaterThanOrEqual(
                    0
                );

                expect(
                    quantidade(
                        cesar,
                        ProdutoId.MIX
                    )
                ).toBeGreaterThanOrEqual(
                    0
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBeGreaterThanOrEqual(
                    0
                );
            }
        );
    }
);
