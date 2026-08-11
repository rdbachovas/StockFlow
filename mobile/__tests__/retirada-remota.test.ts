import {
    afterEach,
    describe,
    expect,
    jest,
    test
} from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { ProdutoId } from "../src/models/Produto";
import { RetiradaEstoque } from "../src/models/RetiradaEstoque";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { PersistenceService } from "../src/services/PersistenceService";
import { RetiradaRemotaService } from "../src/services/RetiradaRemotaService";
import { RetiradaEstoqueService } from "../src/services/RetiradaEstoqueService";

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

function retirada(): RetiradaEstoque {
    return {
        id: "local",
        estoqueOrigemId: "ESTOQUE_PRINCIPAL",
        estoqueDestinoId: "ESTOQUE_RODRIGO",
        responsavelId: "RODRIGO",
        itens: [{ produtoId: ProdutoId.MIX, quantidade: 2 }],
        data: new Date("2026-08-11T12:00:00Z")
    };
}

function snapshot(): SnapshotDto {
    return {
        estoques: [
            { id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null, itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 8 }] },
            { id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO", itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 2 }] },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [],
        retiradas: [{
            id: "backend-id", responsavelId: "RODRIGO", estoqueOrigemId: "ESTOQUE_PRINCIPAL",
            estoqueDestinoId: "ESTOQUE_RODRIGO", itens: [{ produtoId: "MIX", quantidade: 2, saldoAnterior: 10, saldoPosterior: 8 }],
            data: "2026-08-11T12:00:00Z", observacao: null
        }],
        abastecimentos: [], devolucoes: [], movimentosEstoquePrincipal: [], consumosCarrinho: []
    };
}

describe("retirada remota", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("retirada válida chama POST", async () => {
        const post = jest.spyOn(ApiService, "registrarRetirada").mockResolvedValue({} as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        await RetiradaRemotaService.registrar(retirada(), "ONLINE");

        expect(post).toHaveBeenCalledWith(expect.objectContaining({ responsavelId: "RODRIGO" }));
    });

    test("sucesso atualiza pelo snapshot oficial", async () => {
        jest.spyOn(ApiService, "registrarRetirada").mockResolvedValue({} as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const dados = await RetiradaRemotaService.registrar(retirada(), "ONLINE");

        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(8);
        expect(dados.retiradas[0].id).toBe("backend-id");
    });

    test("sucesso persiste novo cache", async () => {
        jest.spyOn(ApiService, "registrarRetirada").mockResolvedValue({} as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        const salvar = jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const dados = await RetiradaRemotaService.registrar(retirada(), "ONLINE");

        expect(salvar).toHaveBeenCalledWith(dados);
    });

    test("falha no POST não altera estado nem busca snapshot", async () => {
        const estadoAnterior = snapshot();
        jest.spyOn(ApiService, "registrarRetirada").mockRejectedValue(new ErroApi("rejeitada", 400));
        const obter = jest.spyOn(ApiService, "obterSnapshot");

        await expect(RetiradaRemotaService.registrar(retirada(), "ONLINE")).rejects.toThrow("rejeitada");
        expect(obter).not.toHaveBeenCalled();
        expect(estadoAnterior.estoques[0].itens[0].quantidade).toBe(8);
    });

    test("falha de rede não executa regra local", async () => {
        jest.spyOn(ApiService, "registrarRetirada").mockRejectedValue(new ErroApi("sem rede"));
        const local = jest.spyOn(RetiradaEstoqueService, "registrar");

        await expect(RetiradaRemotaService.registrar(retirada(), "ONLINE")).rejects.toThrow("sem rede");
        expect(local).not.toHaveBeenCalled();
    });

    test("backend rejeitando estoque insuficiente preserva estado", async () => {
        const anterior = retirada();
        jest.spyOn(ApiService, "registrarRetirada").mockRejectedValue(new ErroApi("Estoque insuficiente.", 422));
        const salvar = jest.spyOn(PersistenceService, "salvar");

        await expect(RetiradaRemotaService.registrar(anterior, "ONLINE")).rejects.toThrow("Estoque insuficiente.");
        expect(anterior.itens[0].quantidade).toBe(2);
        expect(salvar).not.toHaveBeenCalled();
    });

    test("não envia duas retiradas simultâneas", async () => {
        let concluir!: () => void;
        const pendente = new Promise<void>((resolve) => {
            concluir = resolve;
        });
        const post = jest.spyOn(ApiService, "registrarRetirada").mockImplementation(async () => {
            await pendente;
            return {} as never;
        });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const primeira = RetiradaRemotaService.registrar(retirada(), "ONLINE");
        await expect(RetiradaRemotaService.registrar(retirada(), "ONLINE")).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });

    test("datas do snapshot continuam como Date", async () => {
        jest.spyOn(ApiService, "registrarRetirada").mockResolvedValue({} as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const dados = await RetiradaRemotaService.registrar(retirada(), "ONLINE");

        expect(dados.retiradas[0].data).toBeInstanceOf(Date);
    });

    test("offline não registra localmente nem chama o backend", async () => {
        const post = jest.spyOn(ApiService, "registrarRetirada");
        const local = jest.spyOn(RetiradaEstoqueService, "registrar");

        await expect(RetiradaRemotaService.registrar(retirada(), "OFFLINE")).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });
});
