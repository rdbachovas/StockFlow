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
        const comando = await FilaComandosService.adicionar("RETIRADA", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MIX", quantidade: 10 }],
            data: new Date().toISOString()
        });

        expect(comando.commandId).toBe(
            (comando.payload as { commandId: string }).commandId
        );
        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(saldo);
        const conteudo = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        storage.getItem.mockResolvedValue(conteudo);
        FilaComandosService.reiniciarEstadoEmMemoria();

        const restaurados = await FilaComandosService.carregar();
        expect(restaurados).toHaveLength(1);
        expect(restaurados[0].commandId).toBe(comando.commandId);
    });

    test("restart recupera ENVIANDO como PENDENTE sem perder commandId ou payload", async () => {
        const comando = await FilaComandosService.adicionar("ABASTECIMENTO", {
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
        const primeiro = await FilaComandosService.adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA",
            itens: [{ produtoId: "MIX", quantidade: 1 }],
            data: new Date().toISOString()
        });
        const segundo = await FilaComandosService.adicionar("CONSUMO_CARRINHO", {
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
            FilaComandosService.processar("ONLINE"),
            FilaComandosService.processar("ONLINE")
        ]);

        expect(ordem).toEqual([primeiro.commandId, segundo.commandId]);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("falha ambígua preserva commandId e erro definitivo pausa o seguinte", async () => {
        const primeiro = await FilaComandosService.adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA", itens: [{ produtoId: "MIX", quantidade: 1 }], data: new Date().toISOString()
        });
        const segundo = await FilaComandosService.adicionar("CONSUMO_CARRINHO", {
            responsavelId: "RODRIGO", itens: [{ produtoId: "MILHO", quantidade: 1 }], data: new Date().toISOString()
        });
        const movimento = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockRejectedValueOnce(new ErroApi("sem rede"))
            .mockRejectedValueOnce(new ErroApi("inválido", 409));
        const consumo = jest.spyOn(ApiService, "registrarConsumoCarrinho")
            .mockResolvedValue({ revisao: 3 } as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot(3));
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await FilaComandosService.processar("ONLINE");
        expect(FilaComandosService.listar()[0].commandId).toBe(primeiro.commandId);
        await FilaComandosService.processar("ONLINE");

        expect(movimento.mock.calls[0][0].commandId).toBe(primeiro.commandId);
        expect(movimento.mock.calls[1][0].commandId).toBe(primeiro.commandId);
        expect(consumo).not.toHaveBeenCalled();
        expect(FilaComandosService.listar()).toEqual([
            expect.objectContaining({ commandId: primeiro.commandId, status: "CONFLITO" }),
            expect.objectContaining({ commandId: segundo.commandId, status: "PENDENTE" })
        ]);

        await FilaComandosService.descartar(primeiro.commandId);
        await FilaComandosService.processar("ONLINE");
        expect(consumo.mock.calls[0][0].commandId).toBe(segundo.commandId);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("snapshot pendente bloqueia o próximo comando e a recuperação não repete o POST", async () => {
        const primeiro = await FilaComandosService.adicionar("MOVIMENTO_PRINCIPAL", {
            tipo: "ENTRADA", itens: [{ produtoId: "MIX", quantidade: 1 }], data: new Date().toISOString()
        });
        const segundo = await FilaComandosService.adicionar("CONSUMO_CARRINHO", {
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

        await FilaComandosService.processar("ONLINE");

        expect(movimento).toHaveBeenCalledTimes(1);
        expect(consumo).not.toHaveBeenCalled();
        expect(FilaComandosService.listar()).toEqual([
            expect.objectContaining({ commandId: primeiro.commandId, status: "ENVIANDO" }),
            expect.objectContaining({ commandId: segundo.commandId, status: "PENDENTE" })
        ]);

        await FilaComandosService.processar("ONLINE");

        expect(movimento).toHaveBeenCalledTimes(1);
        expect(consumo).toHaveBeenCalledTimes(1);
        expect(FilaComandosService.listar()).toHaveLength(0);
    });

    test("retry conserva commandId, nova intenção recebe outro e conflito sobrevive restart", async () => {
        const comando = await FilaComandosService.adicionar("RETIRADA", {
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

        await FilaComandosService.processar("ONLINE");
        const conteudo = storage.setItem.mock.calls.at(-1)?.[1] ?? "";
        storage.getItem.mockResolvedValue(conteudo);
        FilaComandosService.reiniciarEstadoEmMemoria();

        const restaurado = (await FilaComandosService.carregar())[0];
        expect(restaurado).toEqual(expect.objectContaining({
            commandId: comando.commandId,
            status: "CONFLITO",
            payload: comando.payload
        }));

        await FilaComandosService.reenviar(comando.commandId, "ONLINE");
        expect(post.mock.calls[0][0].commandId).toBe(comando.commandId);
        expect(post.mock.calls[1][0].commandId).toBe(comando.commandId);
        const novaIntencao = await FilaComandosService.adicionar("RETIRADA", {
            responsavelId: "RODRIGO",
            itens: [{ produtoId: "MIX", quantidade: 2 }],
            data: new Date().toISOString()
        });
        expect(novaIntencao.commandId).not.toBe(comando.commandId);
    });

    test("reconciliação final aplica revisão válida, esvazia fila e volta para ONLINE", async () => {
        await FilaComandosService.adicionar("CONSUMO_CARRINHO", {
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

        await FilaComandosService.processar(
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
});
