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
    StatusReserva
} from "../src/models/Reserva";

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


function novaReserva(
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
// RESERVAS - ERROS DO USUÁRIO
// =====================================================

describe(
    "Reservas - validações",
    () => {

        test(
            "não permite reservar mais do que está livre",
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

                expect(
                    () =>
                        ReservaService
                            .criarReserva(
                                rodrigo,
                                reservas,
                                novaReserva(
                                    ProdutoId.MIX,
                                    21,
                                    DestinoReservaId.MERCADOS
                                )
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    20
                );

                expect(
                    reservas
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "não permite reserva com quantidade zero",
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

                expect(
                    () =>
                        ReservaService
                            .criarReserva(
                                rodrigo,
                                reservas,
                                novaReserva(
                                    ProdutoId.MIX,
                                    0,
                                    DestinoReservaId.MERCADOS
                                )
                            )
                ).toThrow();

                expect(
                    reservas
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "Cesar não pode reservar para Boulevard",
            () => {

                const cesar =
                    criarEstoque(
                        "CESAR",
                        "Cesar",
                        UsuarioId.CESAR,
                        [
                            [
                                ProdutoId.MIX,
                                30
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
                                cesar,
                                reservas,
                                novaReserva(
                                    ProdutoId.MIX,
                                    10,
                                    DestinoReservaId.BOULEVARD,
                                    UsuarioId.CESAR
                                )
                            )
                ).toThrow();

                expect(
                    reservas
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "Rodrigo não pode reservar para Aeroporto",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                30
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
                                novaReserva(
                                    ProdutoId.MIX,
                                    10,
                                    DestinoReservaId.AEROPORTO
                                )
                            )
                ).toThrow();

                expect(
                    reservas
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "BIG não pode ser reservado para MERCADOS",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.BIG,
                                30
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
                                novaReserva(
                                    ProdutoId.BIG,
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
            }
        );


        test(
            "MIX não pode ser reservado para Boa Vista",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                30
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
                                novaReserva(
                                    ProdutoId.MIX,
                                    10,
                                    DestinoReservaId.SUPERMAGO_BOA_VISTA
                                )
                            )
                ).toThrow();

                expect(
                    reservas
                ).toHaveLength(
                    0
                );
            }
        );
    }
);


// =====================================================
// ABASTECIMENTO - ERROS
// =====================================================

describe(
    "Abastecimento - validações",
    () => {

        test(
            "não permite abastecer mais do que existe",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                10
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                const maquina =
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
                                                maquina.id,

                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                11
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
                    10
                );

                expect(
                    abastecimentos
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "máquina de mercado não aceita BIG",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.BIG,
                                20
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                const maquina =
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
                                                maquina.id,

                                            produtoId:
                                                ProdutoId.BIG,

                                            quantidade:
                                                5
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
                        ProdutoId.BIG
                    )
                ).toBe(
                    20
                );
            }
        );


        test(
            "não aceita máquina pertencente a outro local",
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

                const abastecimentos:
                    Abastecimento[] =
                    [];

                const maquinaBoulevard =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.BOULEVARD
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
                                                maquinaBoulevard.id,

                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                5
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
                    20
                );
            }
        );


        test(
            "não aceita o mesmo produto duplicado na mesma máquina",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                30
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const abastecimentos:
                    Abastecimento[] =
                    [];

                const maquina =
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
                                                maquina.id,

                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                5
                                        },

                                        {
                                            maquinaId:
                                                maquina.id,

                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                4
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
                    30
                );

                expect(
                    abastecimentos
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "abastecimento inválido não altera nem estoque nem reserva",
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

                const mercados =
                    novaReserva(
                        ProdutoId.MIX,
                        30,
                        DestinoReservaId.MERCADOS
                    );

                const boulevard =
                    novaReserva(
                        ProdutoId.MIX,
                        20,
                        DestinoReservaId.BOULEVARD
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        mercados
                    );

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        boulevard
                    );

                const historicoMercados =
                    mercados.historico?.length ??
                    0;

                const maquina =
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
                                                maquina.id,

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
                    mercados.historico?.length ??
                    0
                ).toBe(
                    historicoMercados
                );

                expect(
                    abastecimentos
                ).toHaveLength(
                    0
                );
            }
        );
    }
);


// =====================================================
// DEVOLUÇÕES - ERROS
// =====================================================

describe(
    "Devoluções - validações",
    () => {

        test(
            "não permite devolver mais estoque livre do que existe",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal"
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                10
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

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
                                11,

                            reservas:
                                []
                        }
                    ],

                    data:
                        new Date()
                };

                expect(
                    () =>
                        DevolucaoEstoqueService
                            .registrar(
                                rodrigo,
                                principal,
                                reservas,
                                devolucoes,
                                devolucao
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    10
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    0
                );
            }
        );


        test(
            "não permite devolver mais do que está reservado no destino",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal"
                    );

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

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

                ReservaService
                    .criarReserva(
                        rodrigo,
                        reservas,
                        novaReserva(
                            ProdutoId.MIX,
                            10,
                            DestinoReservaId.MERCADOS
                        )
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
                                0,

                            reservas: [
                                {
                                    destinoId:
                                        DestinoReservaId.MERCADOS,

                                    quantidade:
                                        11
                                }
                            ]
                        }
                    ],

                    data:
                        new Date()
                };

                expect(
                    () =>
                        DevolucaoEstoqueService
                            .registrar(
                                rodrigo,
                                principal,
                                reservas,
                                devolucoes,
                                devolucao
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
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
                            DestinoReservaId.MERCADOS
                        )
                ).toBe(
                    10
                );
            }
        );


        test(
            "não permite devolução com total zero",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal"
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                10
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

                expect(
                    () =>
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
                                                0,

                                            reservas:
                                                []
                                        }
                                    ],

                                    data:
                                        new Date()
                                }
                            )
                ).toThrow();

                expect(
                    devolucoes
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "erro em um produto não pode devolver parcialmente outro produto",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal"
                    );

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                10
                            ],
                            [
                                ProdutoId.BIG,
                                5
                            ]
                        ]
                    );

                const reservas:
                    Reserva[] =
                    [];

                const devolucoes:
                    DevolucaoEstoque[] =
                    [];

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
                                5,

                            reservas:
                                []
                        },

                        {
                            produtoId:
                                ProdutoId.BIG,

                            quantidadeLivre:
                                10,

                            reservas:
                                []
                        }
                    ],

                    data:
                        new Date()
                };

                expect(
                    () =>
                        DevolucaoEstoqueService
                            .registrar(
                                rodrigo,
                                principal,
                                reservas,
                                devolucoes,
                                devolucao
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    10
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.BIG
                    )
                ).toBe(
                    5
                );

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    0
                );

                expect(
                    devolucoes
                ).toHaveLength(
                    0
                );
            }
        );
    }
);


// =====================================================
// CARRINHO - ERROS
// =====================================================

describe(
    "Carrinho - validações",
    () => {

        test(
            "não permite consumir mais do que existe",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MILHO,
                                5
                            ]
                        ]
                    );

                const consumos:
                    ConsumoCarrinho[] =
                    [];

                expect(
                    () =>
                        ConsumoCarrinhoService
                            .registrar(
                                rodrigo,
                                consumos,
                                {
                                    id:
                                        id("CONS"),

                                    responsavelId:
                                        UsuarioId.RODRIGO,

                                    itens: [
                                        {
                                            produtoId:
                                                ProdutoId.MILHO,

                                            quantidade:
                                                6
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
                        ProdutoId.MILHO
                    )
                ).toBe(
                    5
                );

                expect(
                    consumos
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "não permite consumo com quantidade zero",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MILHO,
                                5
                            ]
                        ]
                    );

                const consumos:
                    ConsumoCarrinho[] =
                    [];

                expect(
                    () =>
                        ConsumoCarrinhoService
                            .registrar(
                                rodrigo,
                                consumos,
                                {
                                    id:
                                        id("CONS"),

                                    responsavelId:
                                        UsuarioId.RODRIGO,

                                    itens: [
                                        {
                                            produtoId:
                                                ProdutoId.MILHO,

                                            quantidade:
                                                0
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
                        ProdutoId.MILHO
                    )
                ).toBe(
                    5
                );
            }
        );


        test(
            "não permite registrar MIX como consumo do carrinho",
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

                const consumos:
                    ConsumoCarrinho[] =
                    [];

                expect(
                    () =>
                        ConsumoCarrinhoService
                            .registrar(
                                rodrigo,
                                consumos,
                                {
                                    id:
                                        id("CONS"),

                                    responsavelId:
                                        UsuarioId.RODRIGO,

                                    itens: [
                                        {
                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                5
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
                    20
                );
            }
        );


        test(
            "item inválido não pode consumir parcialmente outro insumo",
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
                                ProdutoId.OLEO,
                                2
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
                                ProdutoId.OLEO,

                            quantidade:
                                5
                        }
                    ],

                    data:
                        new Date()
                };

                expect(
                    () =>
                        ConsumoCarrinhoService
                            .registrar(
                                rodrigo,
                                consumos,
                                solicitacao
                            )
                ).toThrow();

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    10
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
                    0
                );
            }
        );


        test(
            "consumo de insumo não interfere em reservas de pelúcias",
            () => {

                const rodrigo =
                    criarEstoque(
                        "RODRIGO",
                        "Rodrigo",
                        UsuarioId.RODRIGO,
                        [
                            [
                                ProdutoId.MIX,
                                30
                            ],
                            [
                                ProdutoId.MILHO,
                                10
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
                        novaReserva(
                            ProdutoId.MIX,
                            20,
                            DestinoReservaId.MERCADOS
                        )
                    );

                const consumos:
                    ConsumoCarrinho[] =
                    [];

                ConsumoCarrinhoService
                    .registrar(
                        rodrigo,
                        consumos,
                        {
                            id:
                                id("CONS"),

                            responsavelId:
                                UsuarioId.RODRIGO,

                            itens: [
                                {
                                    produtoId:
                                        ProdutoId.MILHO,

                                    quantidade:
                                        4
                                }
                            ],

                            data:
                                new Date()
                        }
                    );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MILHO
                    )
                ).toBe(
                    6
                );

                expect(
                    quantidade(
                        rodrigo,
                        ProdutoId.MIX
                    )
                ).toBe(
                    30
                );

                expect(
                    ReservaService
                        .quantidadeReservada(
                            reservas,
                            ProdutoId.MIX,
                            UsuarioId.RODRIGO
                        )
                ).toBe(
                    20
                );
            }
        );
    }
);


// =====================================================
// ESTOQUE PRINCIPAL - ERROS
// =====================================================

describe(
    "Estoque Principal - validações",
    () => {

        test(
            "não permite remover mais do que existe",
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
                            ]
                        ]
                    );

                const movimentos:
                    MovimentoEstoquePrincipal[] =
                    [];

                expect(
                    () =>
                        MovimentoEstoquePrincipalService
                            .registrar(
                                principal,
                                movimentos,
                                {
                                    id:
                                        id("MOV"),

                                    tipo:
                                        TipoMovimentoEstoquePrincipal.SAIDA,

                                    responsavelId:
                                        UsuarioId.RODRIGO,

                                    itens: [
                                        {
                                            produtoId:
                                                ProdutoId.MIX,

                                            quantidade:
                                                11
                                        }
                                    ],

                                    data:
                                        new Date()
                                }
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
                    movimentos
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "não permite entrada com quantidade zero",
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
                            ]
                        ]
                    );

                const movimentos:
                    MovimentoEstoquePrincipal[] =
                    [];

                expect(
                    () =>
                        MovimentoEstoquePrincipalService
                            .registrar(
                                principal,
                                movimentos,
                                {
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
                                                0
                                        }
                                    ],

                                    data:
                                        new Date()
                                }
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
            }
        );


        test(
            "erro em um produto não pode alterar parcialmente outro",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [
                            [
                                ProdutoId.MIX,
                                20
                            ],
                            [
                                ProdutoId.MILHO,
                                5
                            ]
                        ]
                    );

                const movimentos:
                    MovimentoEstoquePrincipal[] =
                    [];

                const solicitacao:
                    SolicitacaoMovimentoEstoquePrincipal = {

                    id:
                        id("MOV"),

                    tipo:
                        TipoMovimentoEstoquePrincipal.SAIDA,

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
                        MovimentoEstoquePrincipalService
                            .registrar(
                                principal,
                                movimentos,
                                solicitacao
                            )
                ).toThrow();

                expect(
                    quantidade(
                        principal,
                        ProdutoId.MIX
                    )
                ).toBe(
                    20
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
                    movimentos
                ).toHaveLength(
                    0
                );
            }
        );


        test(
            "operação inválida não aparece no histórico",
            () => {

                const principal =
                    criarEstoque(
                        "PRINCIPAL",
                        "Principal",
                        undefined,
                        [
                            [
                                ProdutoId.BIG,
                                5
                            ]
                        ]
                    );

                const movimentos:
                    MovimentoEstoquePrincipal[] =
                    [];

                expect(
                    () =>
                        MovimentoEstoquePrincipalService
                            .registrar(
                                principal,
                                movimentos,
                                {
                                    id:
                                        id("MOV"),

                                    tipo:
                                        TipoMovimentoEstoquePrincipal.SAIDA,

                                    responsavelId:
                                        UsuarioId.CESAR,

                                    itens: [
                                        {
                                            produtoId:
                                                ProdutoId.BIG,

                                            quantidade:
                                                50
                                        }
                                    ],

                                    data:
                                        new Date()
                                }
                            )
                ).toThrow();

                expect(
                    movimentos
                ).toHaveLength(
                    0
                );
            }
        );
    }
);
