import {
    afterEach,
    describe,
    expect,
    jest,
    test
} from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { ApiService } from "../src/services/ApiService";
import { InicializacaoService } from "../src/services/InicializacaoService";
import { PersistenceService } from "../src/services/PersistenceService";
import { SnapshotMapper } from "../src/services/SnapshotMapper";
import { criarDadosIniciais } from "../src/data/AppData";

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

function snapshotValido(): SnapshotDto {
    return {
        estoques: [
            { id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null, itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 9 }] },
            { id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO", itens: [] },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [{
            id: "r1", responsavelId: "RODRIGO", destino: "BOULEVARD", produtoId: "MIX",
            quantidade: 3, quantidadeUtilizada: 1, quantidadeLiberada: 0, quantidadeRestante: 2,
            status: "ATIVA", dataCriacao: "2026-08-10T10:00:00Z",
            eventos: [{ id: "e1", tipo: "CRIACAO", quantidade: 3, data: "2026-08-10T10:00:00Z" }]
        }],
        retiradas: [], abastecimentos: [], devolucoes: [],
        movimentosEstoquePrincipal: [], consumosCarrinho: []
    };
}

describe("inicialização pelo snapshot", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("snapshot válido substitui cache", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "VALIDO", dados: criarDadosIniciais() });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotValido());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados.estoquePrincipal.itens[0].quantidade).toBe(9);
    });

    test("snapshot é persistido no AsyncStorage", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotValido());
        const salvar = jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await InicializacaoService.carregar();

        expect(salvar).toHaveBeenCalledWith(expect.objectContaining({ reservas: expect.any(Array) }));
    });

    test("datas são restauradas como Date", () => {
        const dados = SnapshotMapper.paraDadosIniciais(snapshotValido());

        expect(dados.reservas[0].dataCriacao).toBeInstanceOf(Date);
        expect(dados.reservas[0].historico?.[0].data).toBeInstanceOf(Date);
    });

    test("backend indisponível mantém cache", async () => {
        const cache = criarDadosIniciais();
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "VALIDO", dados: cache });
        jest.spyOn(ApiService, "obterSnapshot").mockRejectedValue(new Error("offline"));

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados).toBe(cache);
    });

    test("JSON inválido não destrói cache", async () => {
        const cache = criarDadosIniciais();
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "VALIDO", dados: cache });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue({ invalido: true } as never);
        const salvar = jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados).toBe(cache);
        expect(salvar).not.toHaveBeenCalled();
        expect(resultado.estadoSincronizacao).toBe("ERRO");
    });

    test("quantidade remota inválida não destrói cache", async () => {
        const cache = criarDadosIniciais();
        const snapshot = snapshotValido();
        snapshot.estoques[0].itens[0].quantidade = -1;
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "VALIDO", dados: cache });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot);
        const salvar = jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados).toBe(cache);
        expect(resultado.estadoSincronizacao).toBe("ERRO");
        expect(salvar).not.toHaveBeenCalled();
    });

    test("estado ONLINE após sucesso", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotValido());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        expect((await InicializacaoService.carregar()).estadoSincronizacao).toBe("ONLINE");
    });

    test("estado OFFLINE após falha", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockRejectedValue(new Error("offline"));

        expect((await InicializacaoService.carregar()).estadoSincronizacao).toBe("OFFLINE");
    });

    test("seed somente quando não existe cache nem snapshot utilizável", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockRejectedValue(new Error("offline"));

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados).toEqual(criarDadosIniciais());
    });

    test("primeira execução com backend disponível usa snapshot oficial", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotValido());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados.estoquePrincipal.itens[0].quantidade).toBe(9);
        expect(resultado.estadoSincronizacao).toBe("ONLINE");
    });

    test("falha ao atualizar cache não descarta snapshot remoto válido", async () => {
        jest.spyOn(PersistenceService, "carregar").mockResolvedValue({ tipo: "AUSENTE" });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotValido());
        jest.spyOn(PersistenceService, "salvar").mockRejectedValue(new Error("storage indisponível"));

        const resultado = await InicializacaoService.carregar();

        expect(resultado.dados.estoquePrincipal.itens[0].quantidade).toBe(9);
        expect(resultado.estadoSincronizacao).toBe("ERRO");
    });
});

describe("ApiService", () => {
    const apiUrlAnterior = process.env.EXPO_PUBLIC_API_URL;

    afterEach(() => {
        if (apiUrlAnterior === undefined) {
            delete process.env.EXPO_PUBLIC_API_URL;
        } else {
            process.env.EXPO_PUBLIC_API_URL = apiUrlAnterior;
        }
        jest.restoreAllMocks();
    });

    test("monta URL do snapshot com EXPO_PUBLIC_API_URL", async () => {
        process.env.EXPO_PUBLIC_API_URL = "https://api.stockflow.test/";
        const buscar = jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => snapshotValido()
        } as Response);

        await ApiService.obterSnapshot();

        expect(buscar).toHaveBeenCalledWith(
            "https://api.stockflow.test/api/v1/snapshot"
        );
    });

    test("retorna snapshot remoto válido recebido como JSON", async () => {
        process.env.EXPO_PUBLIC_API_URL = "https://api.stockflow.test";
        jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => snapshotValido()
        } as Response);

        await expect(ApiService.obterSnapshot()).resolves.toEqual(snapshotValido());
    });

    test("não usa localhost quando a URL não foi configurada", async () => {
        delete process.env.EXPO_PUBLIC_API_URL;
        const buscar = jest.spyOn(global, "fetch");

        await expect(ApiService.obterSnapshot()).rejects.toThrow("Servidor não configurado");
        expect(buscar).not.toHaveBeenCalled();
    });
});
