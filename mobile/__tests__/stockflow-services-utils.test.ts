import {
    describe,
    expect,
    test
} from "@jest/globals";

import {
    Estoque
} from "../src/models/Estoque";

import {
    LocalId
} from "../src/models/Local";

import {
    ProdutoId
} from "../src/models/Produto";

import {
    EstoqueService
} from "../src/services/EstoqueService";

import {
    MaquinaService
} from "../src/services/MaquinaService";

import {
    grupoDoProduto,
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS,
    TODOS_PRODUTOS
} from "../src/utils/ProdutoUtils";

import {
    GrupoProduto
} from "../src/models/GrupoProduto";


function criarEstoque(
    itens: Array<
        [ProdutoId, number]
    > = []
): Estoque {

    return {
        id:
            "TESTE",

        nome:
            "Estoque Teste",

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


describe(
    "EstoqueService - operações básicas",
    () => {

        test(
            "consultar produto inexistente retorna zero",
            () => {

                const estoque =
                    criarEstoque();

                expect(
                    EstoqueService
                        .consultarQuantidade(
                            estoque,
                            ProdutoId.MIX
                        )
                ).toBe(
                    0
                );
            }
        );


        test(
            "adicionar cria produto inexistente no estoque",
            () => {

                const estoque =
                    criarEstoque();

                EstoqueService
                    .adicionar(
                        estoque,
                        ProdutoId.MIX,
                        10
                    );

                expect(
                    EstoqueService
                        .consultarQuantidade(
                            estoque,
                            ProdutoId.MIX
                        )
                ).toBe(
                    10
                );
            }
        );


        test(
            "adicionar acumula em produto já existente",
            () => {

                const estoque =
                    criarEstoque([
                        [
                            ProdutoId.MIX,
                            10
                        ]
                    ]);

                EstoqueService
                    .adicionar(
                        estoque,
                        ProdutoId.MIX,
                        5
                    );

                expect(
                    EstoqueService
                        .consultarQuantidade(
                            estoque,
                            ProdutoId.MIX
                        )
                ).toBe(
                    15
                );
            }
        );


        test(
            "remover reduz corretamente o estoque",
            () => {

                const estoque =
                    criarEstoque([
                        [
                            ProdutoId.MIX,
                            10
                        ]
                    ]);

                EstoqueService
                    .remover(
                        estoque,
                        ProdutoId.MIX,
                        4
                    );

                expect(
                    EstoqueService
                        .consultarQuantidade(
                            estoque,
                            ProdutoId.MIX
                        )
                ).toBe(
                    6
                );
            }
        );


        test(
            "remover além do disponível não altera o saldo",
            () => {

                const estoque =
                    criarEstoque([
                        [
                            ProdutoId.MIX,
                            5
                        ]
                    ]);

                expect(
                    () =>
                        EstoqueService
                            .remover(
                                estoque,
                                ProdutoId.MIX,
                                6
                            )
                ).toThrow();

                expect(
                    EstoqueService
                        .consultarQuantidade(
                            estoque,
                            ProdutoId.MIX
                        )
                ).toBe(
                    5
                );
            }
        );
    }
);


describe(
    "MaquinaService",
    () => {

        test(
            "lista máquinas do Boulevard",
            () => {

                const maquinas =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.BOULEVARD
                        );

                expect(
                    maquinas.length
                ).toBeGreaterThan(
                    0
                );
            }
        );


        test(
            "lista máquinas do Aeroporto",
            () => {

                const maquinas =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.AEROPORTO
                        );

                expect(
                    maquinas.length
                ).toBeGreaterThan(
                    0
                );
            }
        );


        test(
            "busca máquina existente pelo id",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.BOULEVARD
                        )[0];

                const encontrada =
                    MaquinaService
                        .buscarPorId(
                            maquina.id
                        );

                expect(
                    encontrada
                ).toBeDefined();

                expect(
                    encontrada?.id
                ).toBe(
                    maquina.id
                );
            }
        );


        test(
            "máquina do Sam's aceita MIX",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];

                expect(
                    MaquinaService
                        .podeReceber(
                            maquina,
                            ProdutoId.MIX
                        )
                ).toBe(
                    true
                );
            }
        );


        test(
            "máquina do Sam's aceita CAPIVARAS",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];

                expect(
                    MaquinaService
                        .podeReceber(
                            maquina,
                            ProdutoId.CAPIVARAS
                        )
                ).toBe(
                    true
                );
            }
        );


        test(
            "máquina do Sam's não aceita BIG",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SAMS_CLUB
                        )[0];

                expect(
                    MaquinaService
                        .podeReceber(
                            maquina,
                            ProdutoId.BIG
                        )
                ).toBe(
                    false
                );
            }
        );


        test(
            "Boa Vista aceita BIG",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SUPERMAGO_BOA_VISTA
                        )[0];

                expect(
                    MaquinaService
                        .podeReceber(
                            maquina,
                            ProdutoId.BIG
                        )
                ).toBe(
                    true
                );
            }
        );


        test(
            "Boa Vista não aceita MIX",
            () => {

                const maquina =
                    MaquinaService
                        .listarPorLocal(
                            LocalId.SUPERMAGO_BOA_VISTA
                        )[0];

                expect(
                    MaquinaService
                        .podeReceber(
                            maquina,
                            ProdutoId.MIX
                        )
                ).toBe(
                    false
                );
            }
        );
    }
);


describe(
    "ProdutoUtils",
    () => {

        test(
            "todos os tipos de pelúcia pertencem ao grupo PELUCIAS",
            () => {

                for (
                    const produto
                    of PRODUTOS_PELUCIAS
                ) {

                    expect(
                        grupoDoProduto(
                            produto
                        )
                    ).toBe(
                        GrupoProduto.PELUCIAS
                    );
                }
            }
        );


        test(
            "todos os insumos pertencem ao grupo CARRINHO_PIPOCA",
            () => {

                for (
                    const produto
                    of PRODUTOS_CARRINHO
                ) {

                    expect(
                        grupoDoProduto(
                            produto
                        )
                    ).toBe(
                        GrupoProduto.CARRINHO_PIPOCA
                    );
                }
            }
        );


        test(
            "lista geral possui pelúcias e insumos",
            () => {

                expect(
                    TODOS_PRODUTOS
                ).toContain(
                    ProdutoId.MIX
                );

                expect(
                    TODOS_PRODUTOS
                ).toContain(
                    ProdutoId.MILHO
                );

                expect(
                    TODOS_PRODUTOS.length
                ).toBe(
                    PRODUTOS_PELUCIAS.length +
                    PRODUTOS_CARRINHO.length
                );
            }
        );


        test(
            "nomes dos produtos importantes estão corretos",
            () => {

                expect(
                    nomeProduto(
                        ProdutoId.MIX
                    )
                ).toBe(
                    "Mix"
                );

                expect(
                    nomeProduto(
                        ProdutoId.MILHO
                    )
                ).toBe(
                    "Milho"
                );

                expect(
                    nomeProduto(
                        ProdutoId.CHOCOLATE
                    )
                ).toBe(
                    "Chocolate em pó"
                );

                expect(
                    nomeProduto(
                        ProdutoId.OLEO
                    )
                ).toBe(
                    "Óleo"
                );
            }
        );
    }
);
