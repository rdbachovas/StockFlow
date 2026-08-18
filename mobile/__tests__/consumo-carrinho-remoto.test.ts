import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { SolicitacaoConsumoCarrinho } from "../src/models/ConsumoCarrinho";
import { ProdutoId } from "../src/models/Produto";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { ConsumoCarrinhoRemotoService } from "../src/services/ConsumoCarrinhoRemotoService";
import { ConsumoCarrinhoService } from "../src/services/ConsumoCarrinhoService";
import { PersistenceService } from "../src/services/PersistenceService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function consumo(
    responsavelId: "RODRIGO" | "CESAR" = "RODRIGO",
    itens: SolicitacaoConsumoCarrinho["itens"] = [
        { produtoId: ProdutoId.MILHO, quantidade: 7 }
    ]
): SolicitacaoConsumoCarrinho {
    return {
        id: "id-local-ignorado",
        responsavelId,
        itens,
        data: new Date("2026-08-18T15:00:00.000Z"),
        observacao: "Evento de domingo"
    };
}

function snapshot(): SnapshotDto {
    return {
        revisao: 1,
        estoques: [
            {
                id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null,
                itens: [{ produtoId: "MILHO", nome: "Milho", grupo: "CARRINHO", quantidade: 100 }]
            },
            {
                id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO",
                itens: [{ produtoId: "MILHO", nome: "Milho", grupo: "CARRINHO", quantidade: 43 }]
            },
            {
                id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR",
                itens: [{ produtoId: "MILHO", nome: "Milho", grupo: "CARRINHO", quantidade: 45 }]
            }
        ],
        reservas: [],
        retiradas: [],
        abastecimentos: [],
        devolucoes: [],
        movimentosEstoquePrincipal: [],
        consumosCarrinho: [{
            id: "consumo-oficial", responsavelId: "RODRIGO", estoqueOrigemId: "ESTOQUE_RODRIGO",
            itens: [{ produtoId: "MILHO", quantidade: 7, saldoAnterior: 50, saldoPosterior: 43 }],
            data: "2026-08-18T15:00:00Z", observacao: "Evento de domingo"
        }]
    };
}

function preparar(oficial = snapshot()): void {
    jest.spyOn(ApiService, "registrarConsumoCarrinho").mockResolvedValue({ id: "consumo-oficial", revisao: 1 });
    jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(oficial);
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
}

describe("consumo remoto do carrinho", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test.each([
        ["Rodrigo", consumo("RODRIGO")],
        ["Cesar", consumo("CESAR")],
        ["MILHO", consumo("RODRIGO", [{ produtoId: ProdutoId.MILHO, quantidade: 1 }])],
        ["CHOCOLATE", consumo("RODRIGO", [{ produtoId: ProdutoId.CHOCOLATE, quantidade: 1 }])],
        ["embalagem média", consumo("RODRIGO", [{ produtoId: ProdutoId.EMBALAGEM_CARRINHO_MEDIA, quantidade: 1 }])],
        ["embalagem grande", consumo("RODRIGO", [{ produtoId: ProdutoId.EMBALAGEM_CARRINHO_GRANDE, quantidade: 1 }])],
        ["OLEO", consumo("RODRIGO", [{ produtoId: ProdutoId.OLEO, quantidade: 1 }])]
    ])("envia somente a intenção para %s", async (_cenario, entrada) => {
        preparar();
        await ConsumoCarrinhoRemotoService.registrar(entrada, "ONLINE");
        expect(ApiService.registrarConsumoCarrinho).toHaveBeenCalledWith({
            responsavelId: entrada.responsavelId,
            itens: entrada.itens,
            data: "2026-08-18T15:00:00.000Z",
            observacao: "Evento de domingo"
        });
    });

    test("envia múltiplos itens em uma única operação", async () => {
        preparar();
        const itens = [
            { produtoId: ProdutoId.MILHO, quantidade: 5 },
            { produtoId: ProdutoId.CHOCOLATE, quantidade: 4 },
            { produtoId: ProdutoId.OLEO, quantidade: 2 }
        ];
        await ConsumoCarrinhoRemotoService.registrar(consumo("RODRIGO", itens), "ONLINE");
        expect(ApiService.registrarConsumoCarrinho).toHaveBeenCalledWith(expect.objectContaining({ itens }));
        expect(ApiService.registrarConsumoCarrinho).toHaveBeenCalledTimes(1);
    });

    test("aplica estoque, histórico e saldos oficiais e atualiza cache", async () => {
        preparar();
        const resultado = await ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE");
        expect(resultado.tipo).toBe("CONFIRMADA");
        if (resultado.tipo !== "CONFIRMADA") return;
        const dados = resultado.dados;
        expect(ApiService.obterSnapshot).toHaveBeenCalledTimes(1);
        expect(dados.estoqueRodrigo.itens[0].quantidade).toBe(43);
        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(100);
        expect(dados.consumosCarrinho[0]).toEqual(expect.objectContaining({
            id: "consumo-oficial",
            estoqueOrigemId: "ESTOQUE_RODRIGO",
            itens: [{ produtoId: ProdutoId.MILHO, quantidade: 7, saldoAnterior: 50, saldoPosterior: 43 }]
        }));
        expect(dados.consumosCarrinho[0].data).toBeInstanceOf(Date);
        expect(PersistenceService.salvar).toHaveBeenCalledWith(dados);
    });

    test.each([
        ["pelúcia rejeitada", "Pelúcias não podem ser consumidas pelo carrinho."],
        ["estoque insuficiente", "Estoque pessoal insuficiente."]
    ])("%s não atualiza snapshot nem cache", async (_cenario, mensagem) => {
        jest.spyOn(ApiService, "registrarConsumoCarrinho").mockRejectedValue(new ErroApi(mensagem, 400));
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        await expect(ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE")).rejects.toThrow(mensagem);
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
    });

    test("offline bloqueia sem POST, snapshot, cache ou regra local", async () => {
        const post = jest.spyOn(ApiService, "registrarConsumoCarrinho");
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(ConsumoCarrinhoService, "registrar");
        await expect(ConsumoCarrinhoRemotoService.registrar(consumo(), "OFFLINE")).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test.each([[400, "dados inválidos"], [404, "não encontrado"], [409, "conflito"]])(
        "erro HTTP %i não altera estado nem cache",
        async (status, mensagem) => {
            jest.spyOn(ApiService, "registrarConsumoCarrinho").mockRejectedValue(new ErroApi(mensagem, status));
            const obter = jest.spyOn(ApiService, "obterSnapshot");
            const salvar = jest.spyOn(PersistenceService, "salvar");
            const local = jest.spyOn(ConsumoCarrinhoService, "registrar");
            await expect(ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE")).rejects.toThrow(mensagem);
            expect(obter).not.toHaveBeenCalled();
            expect(salvar).not.toHaveBeenCalled();
            expect(local).not.toHaveBeenCalled();
        }
    );

    test("falha de rede preserva cache e não usa serviço local", async () => {
        jest.spyOn(ApiService, "registrarConsumoCarrinho").mockRejectedValue(new ErroApi("sem rede"));
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(ConsumoCarrinhoService, "registrar");
        await expect(ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE")).rejects.toThrow("sem rede");
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test("dupla submissão gera somente um POST", async () => {
        let concluir!: () => void;
        const pendente = new Promise<void>((resolve) => { concluir = resolve; });
        const post = jest.spyOn(ApiService, "registrarConsumoCarrinho").mockImplementation(async () => {
            await pendente;
            return { id: "consumo-oficial", revisao: 1 };
        });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const primeira = ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE");
        await expect(ConsumoCarrinhoRemotoService.registrar(consumo(), "ONLINE")).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });
});
