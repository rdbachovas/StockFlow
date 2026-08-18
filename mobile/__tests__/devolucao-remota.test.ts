import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { DevolucaoEstoque } from "../src/models/DevolucaoEstoque";
import { DestinoReservaId } from "../src/models/DestinoReserva";
import { ProdutoId } from "../src/models/Produto";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { DevolucaoEstoqueService } from "../src/services/DevolucaoEstoqueService";
import { DevolucaoRemotaService } from "../src/services/DevolucaoRemotaService";
import { PersistenceService } from "../src/services/PersistenceService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function devolucao(
    responsavelId: "RODRIGO" | "CESAR" = "RODRIGO",
    produtoId: ProdutoId = ProdutoId.MIX,
    quantidadeLivre = 20,
    reservas: DevolucaoEstoque["itens"][number]["reservas"] = []
): DevolucaoEstoque {
    return {
        id: "id-local-ignorado",
        estoqueOrigemId: `ESTOQUE_${responsavelId}`,
        estoqueDestinoId: "ESTOQUE_PRINCIPAL",
        responsavelId,
        itens: [{ produtoId, quantidadeLivre, reservas }],
        data: new Date("2026-08-18T12:00:00.000Z"),
        observacao: "Retorno"
    };
}

function snapshot(): SnapshotDto {
    return {
        estoques: [
            {
                id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null,
                itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 335 }]
            },
            {
                id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO",
                itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 65 }]
            },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [
            {
                id: "mercados", responsavelId: "RODRIGO", destino: "MERCADOS", produtoId: "MIX",
                quantidade: 30, quantidadeUtilizada: 0, quantidadeLiberada: 10,
                quantidadeRestante: 20, status: "ATIVA", dataCriacao: "2026-08-17T12:00:00Z",
                eventos: [{ id: "liberacao-1", tipo: "LIBERACAO", quantidade: 10, data: "2026-08-18T12:00:00Z" }]
            },
            {
                id: "boulevard", responsavelId: "RODRIGO", destino: "BOULEVARD", produtoId: "MIX",
                quantidade: 20, quantidadeUtilizada: 0, quantidadeLiberada: 5,
                quantidadeRestante: 15, status: "ATIVA", dataCriacao: "2026-08-17T12:00:00Z",
                eventos: [{ id: "liberacao-2", tipo: "LIBERACAO", quantidade: 5, data: "2026-08-18T12:00:00Z" }]
            }
        ],
        retiradas: [],
        abastecimentos: [],
        devolucoes: [{
            id: "devolucao-oficial", responsavelId: "RODRIGO",
            estoqueOrigemId: "ESTOQUE_RODRIGO", estoqueDestinoId: "ESTOQUE_PRINCIPAL",
            itens: [{
                produtoId: "MIX", quantidadeLivre: 20, quantidadeReservada: 15,
                quantidadeTotal: 35, saldoPessoalAnterior: 100, saldoPessoalPosterior: 65,
                saldoPrincipalAnterior: 300, saldoPrincipalPosterior: 335,
                reservas: [
                    { reservaId: "mercados", destino: "MERCADOS", quantidade: 10 },
                    { reservaId: "boulevard", destino: "BOULEVARD", quantidade: 5 }
                ]
            }],
            data: "2026-08-18T12:00:00Z", observacao: "Retorno"
        }],
        movimentosEstoquePrincipal: [],
        consumosCarrinho: []
    };
}

function preparar(oficial = snapshot()): void {
    jest.spyOn(ApiService, "registrarDevolucao").mockResolvedValue({ id: "devolucao-oficial" });
    jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(oficial);
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
}

describe("devolução remota", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test.each([
        ["somente livre", devolucao("RODRIGO", ProdutoId.MIX, 20, [])],
        ["somente reservada", devolucao("RODRIGO", ProdutoId.MIX, 0, [{ destinoId: DestinoReservaId.MERCADOS, quantidade: 10 }])],
        ["livre e reservada", devolucao("RODRIGO", ProdutoId.MIX, 20, [{ destinoId: DestinoReservaId.MERCADOS, quantidade: 10 }])],
        ["Rodrigo", devolucao("RODRIGO")],
        ["Cesar", devolucao("CESAR")],
        ["insumo do carrinho", devolucao("RODRIGO", ProdutoId.MILHO, 8)]
    ])("envia intenção para %s", async (_cenario, entrada) => {
        preparar();
        await DevolucaoRemotaService.registrar(entrada, "ONLINE");
        expect(ApiService.registrarDevolucao).toHaveBeenCalledWith({
            responsavelId: entrada.responsavelId,
            itens: entrada.itens.map((item) => ({
                produtoId: item.produtoId,
                quantidadeLivre: item.quantidadeLivre,
                reservas: item.reservas.map((reserva) => ({
                    destino: reserva.destinoId,
                    quantidade: reserva.quantidade
                }))
            })),
            data: "2026-08-18T12:00:00.000Z",
            observacao: "Retorno"
        });
    });

    test("envia parcelas explícitas de múltiplos destinos", async () => {
        preparar();
        const entrada = devolucao("RODRIGO", ProdutoId.MIX, 20, [
            { reservaId: "local-1", destinoId: DestinoReservaId.MERCADOS, quantidade: 10 },
            { reservaId: "local-2", destinoId: DestinoReservaId.BOULEVARD, quantidade: 5 }
        ]);
        await DevolucaoRemotaService.registrar(entrada, "ONLINE");
        expect(ApiService.registrarDevolucao).toHaveBeenCalledWith(expect.objectContaining({
            itens: [expect.objectContaining({
                reservas: [
                    { destino: "MERCADOS", quantidade: 10 },
                    { destino: "BOULEVARD", quantidade: 5 }
                ]
            })]
        }));
    });

    test("substitui saldos, reservas e histórico pelo snapshot oficial e atualiza cache", async () => {
        preparar();
        const dados = await DevolucaoRemotaService.registrar(devolucao(), "ONLINE");
        expect(ApiService.obterSnapshot).toHaveBeenCalledTimes(1);
        expect(dados.estoquePrincipal.itens[0].quantidade).toBe(335);
        expect(dados.estoqueRodrigo.itens[0].quantidade).toBe(65);
        expect(dados.reservas.map((reserva) => reserva.quantidadeLiberada)).toEqual([10, 5]);
        expect(dados.devolucoes[0].id).toBe("devolucao-oficial");
        expect(dados.devolucoes[0].data).toBeInstanceOf(Date);
        expect(PersistenceService.salvar).toHaveBeenCalledWith(dados);
    });

    test("offline bloqueia sem POST, snapshot, cache ou regra local", async () => {
        const post = jest.spyOn(ApiService, "registrarDevolucao");
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(DevolucaoEstoqueService, "registrar");
        await expect(DevolucaoRemotaService.registrar(devolucao(), "OFFLINE")).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test.each([[400, "dados inválidos"], [404, "não encontrado"], [409, "conflito"]])(
        "erro HTTP %i não altera snapshot nem cache",
        async (status, mensagem) => {
            jest.spyOn(ApiService, "registrarDevolucao").mockRejectedValue(new ErroApi(mensagem, status));
            const obter = jest.spyOn(ApiService, "obterSnapshot");
            const salvar = jest.spyOn(PersistenceService, "salvar");
            await expect(DevolucaoRemotaService.registrar(devolucao(), "ONLINE")).rejects.toThrow(mensagem);
            expect(obter).not.toHaveBeenCalled();
            expect(salvar).not.toHaveBeenCalled();
        }
    );

    test("falha de rede não altera cache nem usa serviço local", async () => {
        jest.spyOn(ApiService, "registrarDevolucao").mockRejectedValue(new ErroApi("sem rede"));
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const local = jest.spyOn(DevolucaoEstoqueService, "registrar");
        await expect(DevolucaoRemotaService.registrar(devolucao(), "ONLINE")).rejects.toThrow("sem rede");
        expect(salvar).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test("dupla submissão gera somente um POST", async () => {
        let concluir!: () => void;
        const pendente = new Promise<void>((resolve) => { concluir = resolve; });
        const post = jest.spyOn(ApiService, "registrarDevolucao").mockImplementation(async () => {
            await pendente;
            return { id: "oficial" };
        });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const primeira = DevolucaoRemotaService.registrar(devolucao(), "ONLINE");
        await expect(DevolucaoRemotaService.registrar(devolucao(), "ONLINE")).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });
});
