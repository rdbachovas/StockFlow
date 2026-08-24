import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { criarDadosIniciais } from "../src/data/AppData";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { FilaComandosService } from "../src/services/FilaComandosService";
import { PersistenceService } from "../src/services/PersistenceService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const adicionar = (
    tipo: Parameters<typeof FilaComandosService.adicionar>[0],
    payload: Parameters<typeof FilaComandosService.adicionar>[1]
) => FilaComandosService.adicionar(
    tipo,
    payload,
    "RODRIGO"
);

const processar = (
    estado: Parameters<typeof FilaComandosService.processar>[0],
    atualizarEstado?: Parameters<typeof FilaComandosService.processar>[2],
    aplicarResultado?: Parameters<typeof FilaComandosService.processar>[3]
) => FilaComandosService.processar(estado, "RODRIGO", atualizarEstado, aplicarResultado);

const reenviar = (commandId: string, estado: Parameters<typeof FilaComandosService.reenviar>[1]) =>
    FilaComandosService.reenviar(commandId, estado, "RODRIGO");

function snapshot(revisao: number) {
    return {
        revisao,
        estoques: [
            { id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null, itens: [] },
            { id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO", itens: [] },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [],
        retiradas: [],
        abastecimentos: [],
        devolucoes: [],
        movimentosEstoquePrincipal: [],
        consumosCarrinho: []
    };
}

describe("fila offline persistente", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        storage.getItem.mockResolvedValue(null);
        storage.setItem.mockResolvedValue();
        FilaComandosService.reiniciarEstadoEmMemoria();
    });

    test("operação offline persiste sem alterar o snapshot e sobrevive ao restart", async () => {
        const dados = criarDadosIniciais();
        const saldo = dados.estoquePrincipal.itens[0].quantidade;
        const comando = await adicionar("RETIRADA", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MIX", quantidade: 10 }],
            data: new Date().toISOString()
        });

        expect(comando.commandId).toBe(
            (comando.payload as { commandId: string }).commandId
        );
        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(saldo);
        const conteudo = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        expect(conteudo).toContain('"usuarioIdCriador":"RODRIGO"');
        expect(conteudo).not.toContain('"responsavelId"');
        storage.getItem.mockResolvedValue(conteudo);
        FilaComandosService.reiniciarEstadoEmMemoria();

        const restaurados = await FilaComandosService.carregar();
        expect(restaurados).toHaveLength(1);
        expect(restaurados[0].commandId).toBe(comando.commandId);
    });

    test("restart recupera ENVIANDO como PENDENTE sem perder commandId ou payload", async () => {
        const comando = await adicionar("ABASTECIMENTO", {
            responsavelId: "CESAR",
            local: "AEROPORTO",
            itens: [{ produtoId: "MIX", quantidade: 1 }],
            data: new Date().toISOString()
        });
        const persistido = JSON.parse(storage.setItem.mock.calls.at(-1)?.[1] ?? "{}") as {
            comandos: Array<Record<string, unknown>>;
        };
        persistido.comandos[0].status = "ENVIANDO";
        storage.getItem.mockResolvedValue(JSON.stringify(persistido));
        FilaComandosService.reiniciarEstadoEmMemoria();

        const restaurado = (await FilaComandosService.carregar())[0];
        expect(restaurado).toEqual(expect.objectContaining({
            commandId: comando.commandId,
            payload: comando.payload,
            status: "PENDENTE"
        }));
    });

    test("processa em ordem e somente um por vez", async () => {
        const primeiro = await adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA",
            itens: [{ produtoId: "MIX", quantidade: 1 }],
            data: new Date().toISOString()
        });
        const segundo = await adicionar("CONSUMO_CARRINHO", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MILHO", quantidade: 1 }],
            data: new Date().toISOString()
        });
        const ordem: string[] = [];
        jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockImplementation(async (payload) => {
                ordem.push(payload.commandId);
                return { revisao: 1 } as never;
            });
        jest.spyOn(ApiService, "registrarConsumoCarrinho")
            .mockImplementation(async (payload) => {
                ordem.push(payload.commandId);
                return { revisao: 2 } as never;
            });
        jest.spyOn(ApiService, "obterSnapshot")
            .mockResolvedValueOnce(snapshot(1))
            .mockResolvedValueOnce(snapshot(2))
            .mockResolvedValueOnce(snapshot(2));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await Promise.all([
            processar("ONLINE"),
            processar("ONLINE")
        ]);

        expect(ordem).toEqual([primeiro.commandId, segundo.commandId]);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("falha ambígua preserva commandId e erro definitivo pausa o seguinte", async () => {
        const primeiro = await adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA", itens: [{ produtoId: "MIX", quantidade: 1 }], data: new Date().toISOString()
        });
        const segundo = await adicionar("CONSUMO_CARRINHO", {
            responsavelId: "RODRIGO", itens: [{ produtoId: "MILHO", quantidade: 1 }], data: new Date().toISOString()
        });
        const movimento = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockRejectedValueOnce(new ErroApi("sem rede"))
            .mockRejectedValueOnce(new ErroApi("inválido", 409));
        const consumo = jest.spyOn(ApiService, "registrarConsumoCarrinho")
            .mockResolvedValue({ revisao: 3 } as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot(3));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await processar("ONLINE");
        expect(FilaComandosService.listar()[0].commandId).toBe(primeiro.commandId);
        await processar("ONLINE");

        expect(movimento.mock.calls[0][0].commandId).toBe(primeiro.commandId);
        expect(movimento.mock.calls[1][0].commandId).toBe(primeiro.commandId);
        expect(consumo).not.toHaveBeenCalled();
        expect(FilaComandosService.listar()).toEqual([
            expect.objectContaining({ commandId: primeiro.commandId, status: "CONFLITO" }),
            expect.objectContaining({ commandId: segundo.commandId, status: "PENDENTE" })
        ]);

        await FilaComandosService.descartar(primeiro.commandId);
        await processar("ONLINE");
        expect(consumo.mock.calls[0][0].commandId).toBe(segundo.commandId);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("snapshot pendente bloqueia o próximo comando e a recuperação não repete o POST", async () => {
        const primeiro = await adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA", itens: [{ produtoId: "MIX", quantidade: 1 }], data: new Date().toISOString()
        });
        const segundo = await adicionar("CONSUMO_CARRINHO", {
            responsavelId: "CESAR", itens: [{ produtoId: "OLEO", quantidade: 1 }], data: new Date().toISOString()
        });
        const movimento = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockResolvedValue({ revisao: 10 } as never);
        const consumo = jest.spyOn(ApiService, "registrarConsumoCarrinho")
            .mockResolvedValue({ revisao: 11 } as never);
        jest.spyOn(ApiService, "obterSnapshot")
            .mockRejectedValueOnce(new ErroApi("snapshot indisponível"))
            .mockResolvedValueOnce(snapshot(10))
            .mockResolvedValueOnce(snapshot(11))
            .mockResolvedValueOnce(snapshot(11));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await processar("ONLINE");

        expect(movimento).toHaveBeenCalledTimes(1);
        expect(consumo).not.toHaveBeenCalled();
        expect(FilaComandosService.listar()).toEqual([
            expect.objectContaining({ commandId: primeiro.commandId, status: "ENVIANDO" }),
            expect.objectContaining({ commandId: segundo.commandId, status: "PENDENTE" })
        ]);

        await processar("ONLINE");

        expect(movimento).toHaveBeenCalledTimes(1);
        expect(consumo).toHaveBeenCalledTimes(1);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("retry conserva commandId, nova intenção recebe outro e conflito sobrevive restart", async () => {
        const comando = await adicionar("RETIRADA", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MIX", quantidade: 2 }],
            data: new Date().toISOString()
        });
        const post = jest.spyOn(ApiService, "registrarRetirada")
            .mockRejectedValueOnce(new ErroApi("saldo alterado", 409))
            .mockResolvedValueOnce({ revisao: 20 } as never);
        jest.spyOn(ApiService, "obterSnapshot")
            .mockResolvedValueOnce(snapshot(20))
            .mockResolvedValueOnce(snapshot(20));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await processar("ONLINE");
        const conteudo = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        storage.getItem.mockResolvedValue(conteudo);
        FilaComandosService.reiniciarEstadoEmMemoria();

        const restaurado = (await FilaComandosService.carregar())[0];
        expect(restaurado).toEqual(expect.objectContaining({
            commandId: comando.commandId,
            status: "CONFLITO",
            payload: comando.payload
        }));

        await reenviar(comando.commandId, "ONLINE");
        expect(post.mock.calls[0][0].commandId).toBe(comando.commandId);
        expect(post.mock.calls[1][0].commandId).toBe(comando.commandId);
        const novaIntencao = await adicionar("RETIRADA", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MIX", quantidade: 2 }],
            data: new Date().toISOString()
        });
        expect(novaIntencao.commandId).not.toBe(comando.commandId);
    });

    test("reconciliação final aplica revisão válida, esvazia fila e volta para ONLINE", async () => {
        await adicionar("CONSUMO_CARRINHO", {
            responsavelId: "CESAR",
            itens: [{ produtoId: "CHOCOLATE", quantidade: 1 }],
            data: new Date().toISOString()
        });
        jest.spyOn(ApiService, "registrarConsumoCarrinho")
            .mockResolvedValue({ revisao: 30 } as never);
        const obterSnapshot = jest.spyOn(ApiService, "obterSnapshot")
            .mockResolvedValueOnce(snapshot(30))
            .mockResolvedValueOnce(snapshot(31));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const estados: string[] = [];
        const revisoes: number[] = [];

        await processar(
            "ONLINE",
            (estado) => estados.push(estado),
            (resultado) => {
                if (resultado.tipo === "CONFIRMADA") {
                    revisoes.push(resultado.dados.revisaoServidor);
                }
            }
        );

        expect(obterSnapshot).toHaveBeenCalledTimes(2);
        expect(revisoes).toEqual([30, 31]);
        expect(estados.at(-1)).toBe("ONLINE");
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("comando novo pertence ao usuário e outro usuário não o processa", async () => {
        const comando = await FilaComandosService.adicionar("RETIRADA", {
            responsavelId: "CESAR",
            itens: [{ produtoId: "MIX", quantidade: 1 }]
        }, "CESAR");
        const post = jest.spyOn(ApiService, "registrarRetirada").mockResolvedValue({ revisao: 1000 } as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot(1000));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await FilaComandosService.processar("ONLINE", "RODRIGO");
        expect(post).not.toHaveBeenCalled();
        expect(FilaComandosService.listar()[0]).toMatchObject({
            commandId: comando.commandId,
            usuarioIdCriador: "CESAR"
        });

        const persistido = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        storage.getItem.mockResolvedValue(persistido);
        FilaComandosService.reiniciarEstadoEmMemoria();
        await FilaComandosService.processar("ONLINE", "CESAR");
        expect(post).toHaveBeenCalledWith(expect.objectContaining({ commandId: comando.commandId }));
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("fila antiga sem criador determinável requer atenção e não é enviada", async () => {
        storage.getItem.mockResolvedValue(JSON.stringify({
            versao: 2,
            comandos: [{
                commandId: "cmd-antigo",
                tipo: "MOVIMENTO_PRINCIPAL",
                payload: { commandId: "cmd-antigo", tipo: "ENTRADA", itens: [] },
                dataCriacao: new Date().toISOString(),
                status: "PENDENTE",
                tentativas: 0
            }]
        }));
        const post = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal");

        const comando = (await FilaComandosService.carregar())[0];
        await FilaComandosService.processar("ONLINE", "RODRIGO");

        expect(comando.status).toBe("REQUER_ATENCAO");
        expect(comando.usuarioIdCriador).toBeUndefined();
        expect(post).not.toHaveBeenCalled();
    });

    test("migra fila antiga, preserva criador e commandId e remove identidade do payload", async () => {
        storage.getItem.mockResolvedValue(JSON.stringify({
            versao: 3,
            comandos: [{
                commandId: "cmd-legado",
                tipo: "CANCELAR_RESERVA",
                payload: {
                    commandId: "cmd-legado",
                    reservaId: "reserva-1",
                    corpo: { responsavelId: "CESAR" }
                },
                dataCriacao: new Date().toISOString(),
                status: "PENDENTE",
                tentativas: 0
            }]
        }));

        const comando = (await FilaComandosService.carregar())[0];

        expect(comando).toMatchObject({
            commandId: "cmd-legado",
            usuarioIdCriador: "CESAR"
        });
        expect(JSON.stringify(comando.payload)).not.toContain("responsavelId");
        const migrado = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        expect(migrado).toContain('"versao":4');
        expect(migrado).not.toContain('"responsavelId"');
    });

    test("fila persistida não contém tokens e logout não a remove", async () => {
        await FilaComandosService.adicionar("CONSUMO_CARRINHO", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MILHO", quantidade: 1 }]
        }, "RODRIGO");
        const conteudo = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        expect(conteudo).not.toMatch(/accessToken|refreshToken|Bearer/);
        expect(storage.setItem).toHaveBeenCalled();
        expect(storage.getItem).toBeDefined();
    });
});
