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
});
