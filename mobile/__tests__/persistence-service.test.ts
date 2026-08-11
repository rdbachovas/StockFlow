import {
    beforeEach,
    describe,
    expect,
    jest,
    test
} from "@jest/globals";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    criarDadosIniciais
} from "../src/data/AppData";

import {
    DestinoReservaId
} from "../src/models/DestinoReserva";

import { LocalId } from "../src/models/Local";
import { MaquinaId } from "../src/models/Maquina";

import {
    TipoMovimentoEstoquePrincipal
} from "../src/models/MovimentoEstoquePrincipal";

import { ProdutoId } from "../src/models/Produto";

import {
    StatusReserva,
    TipoEventoReserva
} from "../src/models/Reserva";

import { UsuarioId } from "../src/models/Usuario";

import {
    CHAVE_ESTADO_APP,
    PersistenceService,
    VERSAO_ESTADO_APP
} from "../src/services/PersistenceService";

jest.mock(
    "@react-native-async-storage/async-storage",
    () => ({
        __esModule: true,
        default: {
            getItem: jest.fn(),
            setItem: jest.fn()
        }
    })
);

const armazenamento =
    AsyncStorage as jest.Mocked<
        typeof AsyncStorage
    >;

function criarDadosComHistorico() {
    const dados = criarDadosIniciais();
    const data = new Date(
        "2026-08-11T12:30:00.000Z"
    );

    dados.reservas.push({
        id: "RESERVA_1",
        responsavelId: UsuarioId.RODRIGO,
        destinoId: DestinoReservaId.BOULEVARD,
        produtoId: ProdutoId.MIX,
        quantidade: 10,
        quantidadeUtilizada: 2,
        quantidadeLiberada: 1,
        status: StatusReserva.ATIVA,
        dataCriacao: data,
        historico: [
            {
                id: "EVENTO_1",
                tipo: TipoEventoReserva.CRIACAO,
                quantidade: 10,
                data
            }
        ]
    });

    dados.abastecimentos.push({
        id: "ABASTECIMENTO_1",
        localId: LocalId.BOULEVARD,
        responsavelId: UsuarioId.RODRIGO,
        itens: [
            {
                maquinaId: MaquinaId.M1,
                produtoId: ProdutoId.MIX,
                quantidade: 2
            }
        ],
        data
    });

    dados.retiradas.push({
        id: "RETIRADA_1",
        estoqueOrigemId: "ESTOQUE_PRINCIPAL",
        estoqueDestinoId: "ESTOQUE_RODRIGO",
        responsavelId: UsuarioId.RODRIGO,
        itens: [
            {
                produtoId: ProdutoId.MIX,
                quantidade: 10
            }
        ],
        data
    });

    dados.devolucoes.push({
        id: "DEVOLUCAO_1",
        estoqueOrigemId: "ESTOQUE_RODRIGO",
        estoqueDestinoId: "ESTOQUE_PRINCIPAL",
        responsavelId: UsuarioId.RODRIGO,
        itens: [
            {
                produtoId: ProdutoId.MIX,
                quantidadeLivre: 1,
                reservas: []
            }
        ],
        data
    });

    dados.movimentosEstoquePrincipal.push({
        id: "MOVIMENTO_1",
        tipo:
            TipoMovimentoEstoquePrincipal.ENTRADA,
        responsavelId: UsuarioId.RODRIGO,
        itens: [
            {
                produtoId: ProdutoId.MIX,
                quantidade: 5,
                saldoAnterior: 300,
                saldoPosterior: 305
            }
        ],
        data
    });

    dados.consumosCarrinho.push({
        id: "CONSUMO_1",
        responsavelId: UsuarioId.RODRIGO,
        itens: [
            {
                produtoId: ProdutoId.MILHO,
                quantidade: 1,
                saldoAnterior: 5,
                saldoPosterior: 4
            }
        ],
        data
    });

    return dados;
}

describe(
    "PersistenceService",
    () => {
        beforeEach(
            () => {
                jest.clearAllMocks();
            }
        );

        test(
            "diferencia estado ausente",
            async () => {
                armazenamento.getItem
                    .mockResolvedValue(null);

                await expect(
                    PersistenceService.carregar()
                ).resolves.toEqual({
                    tipo: "AUSENTE"
                });
            }
        );

        test(
            "salva o estado completo em envelope versionado",
            async () => {
                const dados =
                    criarDadosComHistorico();

                armazenamento.setItem
                    .mockResolvedValue();

                await PersistenceService
                    .salvar(dados);

                expect(
                    armazenamento.setItem
                ).toHaveBeenCalledWith(
                    CHAVE_ESTADO_APP,
                    JSON.stringify({
                        versao:
                            VERSAO_ESTADO_APP,
                        dados
                    })
                );
            }
        );

        test(
            "carrega estado válido e restaura todos os campos Date",
            async () => {
                const dados =
                    criarDadosComHistorico();

                armazenamento.getItem
                    .mockResolvedValue(
                        JSON.stringify({
                            versao:
                                VERSAO_ESTADO_APP,
                            dados
                        })
                    );

                const resultado =
                    await PersistenceService
                        .carregar();

                expect(resultado.tipo)
                    .toBe("VALIDO");

                if (
                    resultado.tipo !==
                    "VALIDO"
                ) {
                    throw new Error(
                        "Estado deveria ser válido."
                    );
                }

                const datas = [
                    resultado.dados.reservas[0]
                        .dataCriacao,
                    resultado.dados.reservas[0]
                        .historico?.[0].data,
                    resultado.dados.abastecimentos[0]
                        .data,
                    resultado.dados.retiradas[0].data,
                    resultado.dados.devolucoes[0].data,
                    resultado.dados
                        .movimentosEstoquePrincipal[0]
                        .data,
                    resultado.dados.consumosCarrinho[0]
                        .data
                ];

                for (const data of datas) {
                    expect(data)
                        .toBeInstanceOf(Date);

                    expect(data?.toISOString())
                        .toBe(
                            "2026-08-11T12:30:00.000Z"
                        );
                }
            }
        );

        test.each([
            [
                "JSON corrompido",
                "{conteudo-invalido"
            ],
            [
                "versão desconhecida",
                JSON.stringify({
                    versao: 999,
                    dados:
                        criarDadosIniciais()
                })
            ],
            [
                "estrutura incompleta",
                JSON.stringify({
                    versao:
                        VERSAO_ESTADO_APP,
                    dados: {
                        reservas: []
                    }
                })
            ]
        ])(
            "classifica %s como estado inválido",
            async (
                _cenario,
                conteudo
            ) => {
                armazenamento.getItem
                    .mockResolvedValue(conteudo);

                const resultado =
                    await PersistenceService
                        .carregar();

                expect(resultado.tipo)
                    .toBe("INVALIDO");
            }
        );

        test(
            "classifica falha de leitura como estado inválido",
            async () => {
                armazenamento.getItem
                    .mockRejectedValue(
                        new Error("falha")
                    );

                const resultado =
                    await PersistenceService
                        .carregar();

                expect(resultado.tipo)
                    .toBe("INVALIDO");
            }
        );
    }
);
