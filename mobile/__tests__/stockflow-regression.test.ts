import {
    beforeEach,
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


let sequencia = 0;


function id(
    prefixo: string
): string {

    sequencia++;

    return `${prefixo}_${sequencia}`;
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
    destinoId: DestinoReservaId,
    responsavelId:
        UsuarioId =
        UsuarioId.RODRIGO
): Reserva {

    return {

        id:
            id("RES"),

        responsavelId,

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


beforeEach(
    () => {

        sequencia =
            0;
    }
);


// =====================================================
// 1. PRINCIPAL → PESSOAL
// =====================================================

describe(
    "Transferência Principal → Pessoal",
    () => {

        test(
            "transfere pelúcias e insumos corretamente",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ],
                            [
                                ProdutoId.MILHO,
                                20
                            ]
                        ]
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO
                    );

                const historico:
                    RetiradaEstoque[] =
                    [];

                const retirada:
                    RetiradaEstoque = {

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
                                40
                        },

                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                5
                        }
                    ],

                    data:
                        new Date(
                            "2026-08-10T10:00:00"
                        )
                };

                RetiradaEstoqueService
                    .registrar(
                        principal,
                        rodrigo,
                        historico,
                        retirada
                    );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    60
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    15
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    40
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    5
                );

                expect(
                    historico
                ).toHaveLength(
                    1
                );
            }
        );


        test(
            "retirada inválida não pode alterar parcialmente o estoque",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [
                            [
                                ProdutoId.MIX,
                                10
                            ],
                            [
                                ProdutoId.MILHO,
                                5
                            ]
                        ]
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO
                    );

                const historico:
                    RetiradaEstoque[] =
                    [];

                const retirada:
                    RetiradaEstoque = {

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
                                5
                        },

                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                10
                        }
                    ],

                    data:
                        new Date()
                };

                expect(
                    () =>
                        RetiradaEstoqueService
                            .registrar(
                                principal,
                                rodrigo,
                                historico,
                                retirada
                            )
                ).toThrow();

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    10
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    5
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    0
                );

                expect(
                    historico
                ).toHaveLength(
                    0
                );
            }
        );
    }
);


// =====================================================
// 2. RESERVAS
// =====================================================

describe(
    "Reservas",
    () => {

        test(
            "reservar parte do estoque não reserva tudo",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const mercados =
                    criarReserva(
                        ProdutoId.MIX,
                        30,
                        DestinoReservaId.MERCADOS
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        mercados
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
                    ReservaService
                        .quantidadeReservada(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO
                        )
                ).toBe(
                    30
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    70
                );
            }
        );


        test(
            "permite reservar o mesmo produto para destinos diferentes",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        criarReserva(
                            ProdutoId.MIX,
                            30,
                            DestinoReservaId.MERCADOS
                        )
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        criarReserva(
                            ProdutoId.MIX,
                            20,
                            DestinoReservaId.BOULEVARD
                        )
                    );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    30
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
                    20
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    50
                );
            }
        );


        test(
            "insumos do carrinho não podem virar reserva de máquina",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MILHO,
                                20
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                expect(
                    () =>
                        ReservaService
                            .criarReserva(
                                rodrigo,
                                reservas,
                                criarReserva(
                                    ProdutoId.MILHO,
                                    10,
                                    DestinoReservaId.MERCADOS
                                )
                            )
                ).toThrow();

                expect(
                    reservas
                ).toHaveLength(
                    0
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    20
                );
            }
        );
    }
);


// =====================================================
// 3. MERCADOS COMPARTILHAM A MESMA RESERVA
// =====================================================

describe(
    "Reserva compartilhada MERCADOS",
    () => {

        test(
            "Sam's e Planalto consomem a mesma reserva",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        criarReserva(
                            ProdutoId.MIX,
                            60,
                            DestinoReservaId.MERCADOS
                        )
                    );

                const maquinaSams =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];

                const maquinaPlanalto =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SUPERMAGO_PLANALTO
                        )[0];

                expect(
                    maquinaSams
                ).toBeDefined();

                expect(
                    maquinaPlanalto
                ).toBeDefined();

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
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-10T10:00:00"
                                )
                        }
                    );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    85
                );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    45
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
                                        20
                                }
                            ],

                            data:
                                new Date(
                                    "2026-08-10T11:00:00"
                                )
                        }
                    );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    65
                );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    25
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
                    abastecimentos
                ).toHaveLength(
                    2
                );
            }
        );


        test(
            "mercado não pode roubar quantidade reservada para Boulevard",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                60
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        criarReserva(
                            ProdutoId.MIX,
                            30,
                            DestinoReservaId.MERCADOS
                        )
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        criarReserva(
                            ProdutoId.MIX,
                            20,
                            DestinoReservaId.BOULEVARD
                        )
                    );

                /*
                    60 físico

                    30 mercados
                    20 boulevard
                    10 livre

                    Mercado pode usar no máximo:

                    30 + 10 = 40
                */

                const maquinaSams =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];

                expect(
                    () =>
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
                                                41
                                        }
                                    ],

                                    data:
                                        new Date()
                                }
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    60
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
                    20
                );
            }
        );
    }
);


// =====================================================
// 4. DEVOLUÇÃO
// =====================================================

describe(
    "Pessoal → Principal",
    () => {

        test(
            "devolve saldo livre e partes de reservas escolhidas",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ]
                        ]
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                100
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

                const reservaMercados =
                    criarReserva(
                        ProdutoId.MIX,
                        30,
                        DestinoReservaId.MERCADOS
                    );

                const reservaBoulevard =
                    criarReserva(
                        ProdutoId.MIX,
                        20,
                        DestinoReservaId.BOULEVARD
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reservaMercados
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reservaBoulevard
                    );

                const devolucao:
                    DevolucaoEstoque = {

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
                                20,

                            reservas: [

                                {
                                    destinoId:
                                        DestinoReservaId.MERCADOS,

                                    quantidade:
                                        10
                                },

                                {
                                    destinoId:
                                        DestinoReservaId.BOULEVARD,

                                    quantidade:
                                        5
                                }
                            ]
                        }
                    ],

                    data:
                        new Date()
                };

                DevolucaoEstoqueService
                    .registrar(
                        rodrigo,
                        principal,
                        reservas,
                        devolucoes,
                        devolucao
                    );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    65
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    135
                );

                expect(
                    ReservaService
                        .quantidadeReservadaNoDestino(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO,
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    20
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
                    15
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    30
                );

                expect(
                    devolucoes
                ).toHaveLength(
                    1
                );

                expect(
                    reservaMercados
                        .historico
                        ?.some(
                            (evento) =>
                                evento.tipo ===
                                TipoEventoReserva.LIBERACAO
                        )
                ).toBe(
                    true
                );
            }
        );
    }
);


// =====================================================
// 5. CARRINHO
// =====================================================

describe(
    "Carrinho de Pipoca",
    () => {

        test(
            "consumo reduz o estoque pessoal e registra antes/depois",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [

                            [
                                ProdutoId.MILHO,
                                10
                            ],

                            [
                                ProdutoId.CHOCOLATE,
                                5
                            ],

                            [
                                ProdutoId.OLEO,
                                3
                            ]
                        ]
                    );

                const consumos:
                    ConsumoCarrinho[] =
                    [];

                const solicitacao:
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
                                ProdutoId.CHOCOLATE,

                            quantidade:
                                2
                        },

                        {
                            produtoId:
                                ProdutoId.OLEO,

                            quantidade:
                                1
                        }
                    ],

                    data:
                        new Date(),

                    observacao:
                        "Teste automático"
                };

                ConsumoCarrinhoService
                    .registrar(
                        rodrigo,
                        consumos,
                        solicitacao
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
                        ProdutoId.CHOCOLATE
                    )
                ).toBe(
                    3
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.OLEO
                    )
                ).toBe(
                    2
                );

                expect(
                    consumos
                ).toHaveLength(
                    1
                );

                const milho =
                    consumos[0]
                        .itens
                        .find(
                            (item) =>
                                item.produtoId ===
                                ProdutoId.MILHO
                        );

                expect(
                    milho?.saldoAnterior
                ).toBe(
                    10
                );

                expect(
                    milho?.saldoPosterior
                ).toBe(
                    7
                );
            }
        );
    }
);


// =====================================================
// 6. ESTOQUE PRINCIPAL
// =====================================================

describe(
    "Entradas e ajustes do Estoque Principal",
    () => {

        test(
            "registra entrada e remoção mantendo saldo anterior/posterior",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [

                            [
                                ProdutoId.MIX,
                                100
                            ],

                            [
                                ProdutoId.MILHO,
                                10
                            ]
                        ]
                    );

                const movimentos:
                    MovimentoEstoquePrincipal[] =
                    [];

                const entrada:
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
                                50
                        },

                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                5
                        }
                    ],

                    data:
                        new Date()
                };

                MovimentoEstoquePrincipalService
                    .registrar(
                        principal,
                        movimentos,
                        entrada
                    );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    150
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    15
                );

                const mixEntrada =
                    movimentos[0]
                        .itens
                        .find(
                            (item) =>
                                item.produtoId ===
                                ProdutoId.MIX
                        );

                expect(
                    mixEntrada?.saldoAnterior
                ).toBe(
                    100
                );

                expect(
                    mixEntrada?.saldoPosterior
                ).toBe(
                    150
                );


                const saida:
                    SolicitacaoMovimentoEstoquePrincipal = {

                    id:
                        id("MOV"),

                    tipo:
                        TipoMovimentoEstoquePrincipal.SAIDA,

                    responsavelId:
                        UsuarioId.CESAR,

                    itens: [

                        {
                            produtoId:
                                ProdutoId.MIX,

                            quantidade:
                                20
                        },

                        {
                            produtoId:
                                ProdutoId.MILHO,

                            quantidade:
                                3
                        }
                    ],

                    data:
                        new Date()
                };

                MovimentoEstoquePrincipalService
                    .registrar(
                        principal,
                        movimentos,
                        saida
                    );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    130
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    12
                );

                expect(
                    movimentos
                ).toHaveLength(
                    2
                );
            }
        );
    }
);


// =====================================================
// 7. HISTÓRICO DA RESERVA
// =====================================================

describe(
    "Histórico das reservas",
    () => {

        test(
            "registra criação, utilização e conclusão",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                20
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const reserva =
                    criarReserva(
                        ProdutoId.MIX,
                        10,
                        DestinoReservaId.MERCADOS
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reserva
                    );

                ReservaService
                    .consumirReservasNoDestino(
                        reservas,
                        UsuarioId.RODRIGO,
                        DestinoReservaId.MERCADOS,
                        ProdutoId.MIX,
                        10
                    );

                expect(
                    reserva.status
                ).toBe(
                    StatusReserva.CONCLUIDA
                );

                expect(
                    ReservaService
                        .quantidadeRestante(
                            reserva
                        )
                ).toBe(
                    0
                );

                expect(
                    reserva
                        .historico
                        ?.map(
                            (evento) =>
                                evento.tipo
                        )
                ).toEqual(
                    [
                        TipoEventoReserva.CRIACAO,
                        TipoEventoReserva.UTILIZACAO,
                        TipoEventoReserva.CONCLUSAO
                    ]
                );
            }
        );


        test(
            "cancelar reserva libera o restante e mantém histórico",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                20
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const reserva =
                    criarReserva(
                        ProdutoId.MIX,
                        10,
                        DestinoReservaId.MERCADOS
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        reserva
                    );

                ReservaService
                    .cancelarReserva(
                        reservas,
                        reserva.id,
                        UsuarioId.RODRIGO
                    );

                expect(
                    reserva.status
                ).toBe(
                    StatusReserva.CANCELADA
                );

                expect(
                    reserva.quantidadeLiberada
                ).toBe(
                    10
                );

                expect(
                    ReservaService
                        .quantidadeDisponivel(
                            rodrigo,
                            reservas,
                            ProdutoId.MIX
                        )
                ).toBe(
                    20
                );

                expect(
                    reserva
                        .historico
                        ?.map(
                            (evento) =>
                                evento.tipo
                        )
                ).toEqual(
                    [
                        TipoEventoReserva.CRIACAO,
                        TipoEventoReserva.CANCELAMENTO
                    ]
                );
            }
        );
    }
);
