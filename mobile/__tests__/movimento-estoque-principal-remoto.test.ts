import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import {
    SolicitacaoMovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../src/models/MovimentoEstoquePrincipal";
import { ProdutoId } from "../src/models/Produto";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { MovimentoEstoquePrincipalRemotoService } from "../src/services/MovimentoEstoquePrincipalRemotoService";
import { MovimentoEstoquePrincipalService } from "../src/services/MovimentoEstoquePrincipalService";
import { PersistenceService } from "../src/services/PersistenceService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function movimento(
    tipo = TipoMovimentoEstoquePrincipal.ENTRADA,
    itens: SolicitacaoMovimentoEstoquePrincipal["itens"] = [
        { produtoId: ProdutoId.MIX, quantidade: 20 }
    ]
): SolicitacaoMovimentoEstoquePrincipal {
    return {
        id: "id-local-ignorado",
        tipo,
        responsavelId: "RODRIGO",
        itens,
        data: new Date("2026-08-18T14:00:00.000Z"),
        observacao: "Conferência física"
    };
}

function snapshot(): SnapshotDto {
    return {
        estoques: [
            {
                id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null,
                itens: [
                    { produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 320 },
                    { produtoId: "MILHO", nome: "Milho", grupo: "CARRINHO", quantidade: 42 }
                ]
            },
            { id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO", itens: [] },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [],
        retiradas: [],
        abastecimentos: [],
        devolucoes: [],
        movimentosEstoquePrincipal: [{
            id: "movimento-oficial",
            tipo: "ENTRADA",
            itens: [{ produtoId: "MIX", quantidade: 20, saldoAnterior: 300, saldoPosterior: 320 }],
            data: "2026-08-18T14:00:00Z",
            observacao: "Conferência física"
        }],
        consumosCarrinho: []
    };
}

function preparar(oficial = snapshot()): void {
    jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal").mockResolvedValue({ id: "movimento-oficial" });
    jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(oficial);
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
}

describe("movimento remoto do Estoque Principal", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test.each([
        ["entrada válida", movimento(TipoMovimentoEstoquePrincipal.ENTRADA)],
        ["saída válida", movimento(TipoMovimentoEstoquePrincipal.SAIDA)],
        ["pelúcia", movimento(TipoMovimentoEstoquePrincipal.ENTRADA, [{ produtoId: ProdutoId.BIG, quantidade: 7 }])],
        ["insumo do carrinho", movimento(TipoMovimentoEstoquePrincipal.SAIDA, [{ produtoId: ProdutoId.MILHO, quantidade: 8 }])]
    ])("envia somente a intenção para %s", async (_cenario, entrada) => {
        preparar();
        await MovimentoEstoquePrincipalRemotoService.registrar(entrada, "ONLINE");
        expect(ApiService.registrarMovimentoEstoquePrincipal).toHaveBeenCalledWith({
            tipo: entrada.tipo,
            itens: entrada.itens,
            data: "2026-08-18T14:00:00.000Z",
            observacao: "Conferência física"
        });
    });

    test("envia múltiplos produtos em uma única operação", async () => {
        preparar();
        const itens = [
            { produtoId: ProdutoId.MIX, quantidade: 10 },
            { produtoId: ProdutoId.OLEO, quantidade: 3 }
        ];
        await MovimentoEstoquePrincipalRemotoService.registrar(
            movimento(TipoMovimentoEstoquePrincipal.ENTRADA, itens),
            "ONLINE"
        );
        expect(ApiService.registrarMovimentoEstoquePrincipal).toHaveBeenCalledWith(
            expect.objectContaining({ itens })
        );
        expect(ApiService.registrarMovimentoEstoquePrincipal).toHaveBeenCalledTimes(1);
    });

    test("aplica saldo e histórico oficiais do snapshot e atualiza o cache", async () => {
        preparar();
        const dados = await MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "ONLINE");
        expect(ApiService.obterSnapshot).toHaveBeenCalledTimes(1);
        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(320);
        expect(dados.movimentosEstoquePrincipal[0]).toEqual(expect.objectContaining({
            id: "movimento-oficial",
            tipo: TipoMovimentoEstoquePrincipal.ENTRADA,
            itens: [{ produtoId: ProdutoId.MIX, quantidade: 20, saldoAnterior: 300, saldoPosterior: 320 }]
        }));
        expect(dados.movimentosEstoquePrincipal[0].data).toBeInstanceOf(Date);
        expect(PersistenceService.salvar).toHaveBeenCalledWith(dados);
    });

    test("offline bloqueia sem POST, snapshot, cache ou regra local", async () => {
        const post = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal");
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(MovimentoEstoquePrincipalService, "registrar");
        await expect(
            MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "OFFLINE")
        ).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test.each([[400, "dados inválidos"], [404, "não encontrado"], [409, "conflito"]])(
        "erro HTTP %i não busca snapshot nem altera cache",
        async (status, mensagem) => {
            jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
                .mockRejectedValue(new ErroApi(mensagem, status));
            const obter = jest.spyOn(ApiService, "obterSnapshot");
            const salvar = jest.spyOn(PersistenceService, "salvar");
            const local = jest.spyOn(MovimentoEstoquePrincipalService, "registrar");
            await expect(
                MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "ONLINE")
            ).rejects.toThrow(mensagem);
            expect(obter).not.toHaveBeenCalled();
            expect(salvar).not.toHaveBeenCalled();
            expect(local).not.toHaveBeenCalled();
        }
    );

    test("falha de rede preserva cache e não usa serviço local", async () => {
        jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockRejectedValue(new ErroApi("sem rede"));
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(MovimentoEstoquePrincipalService, "registrar");
        await expect(
            MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "ONLINE")
        ).rejects.toThrow("sem rede");
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test("dupla submissão gera somente um POST", async () => {
        let concluir!: () => void;
        const pendente = new Promise<void>((resolve) => { concluir = resolve; });
        const post = jest.spyOn(ApiService, "registrarMovimentoEstoquePrincipal")
            .mockImplementation(async () => {
                await pendente;
                return { id: "movimento-oficial" };
            });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const primeira = MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "ONLINE");
        await expect(
            MovimentoEstoquePrincipalRemotoService.registrar(movimento(), "ONLINE")
        ).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });
});
