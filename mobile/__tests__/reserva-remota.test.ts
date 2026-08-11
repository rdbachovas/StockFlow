import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { DestinoReservaId } from "../src/models/DestinoReserva";
import { ProdutoId } from "../src/models/Produto";
import { Reserva, StatusReserva } from "../src/models/Reserva";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { PersistenceService } from "../src/services/PersistenceService";
import { ReservaRemotaService } from "../src/services/ReservaRemotaService";
import { ReservaService } from "../src/services/ReservaService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function reserva(): Reserva {
    return {
        id: "local", responsavelId: "RODRIGO", destinoId: DestinoReservaId.BOULEVARD,
        produtoId: ProdutoId.MIX, quantidade: 4, quantidadeUtilizada: 0,
        status: StatusReserva.ATIVA
    };
}

function snapshot(status = "ATIVA"): SnapshotDto {
    return {
        estoques: [
            { id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null, itens: [] },
            { id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO", itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 10 }] },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [{
            id: "backend-id", responsavelId: "RODRIGO", destino: "BOULEVARD", produtoId: "MIX",
            quantidade: 4, quantidadeUtilizada: 0, quantidadeLiberada: status === "CANCELADA" ? 4 : 0,
            quantidadeRestante: status === "CANCELADA" ? 0 : 4, status,
            dataCriacao: "2026-08-11T12:00:00Z",
            eventos: [{ id: "evento-backend", tipo: status === "CANCELADA" ? "CANCELAMENTO" : "CRIACAO", quantidade: 4, data: "2026-08-11T12:00:00Z" }]
        }],
        retiradas: [], abastecimentos: [], devolucoes: [], movimentosEstoquePrincipal: [], consumosCarrinho: []
    };
}

function preparar(snapshotOficial = snapshot()): jest.SpiedFunction<typeof ApiService.obterSnapshot> {
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
    return jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshotOficial);
}

describe("reservas remotas", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("criação válida chama POST", async () => {
        const post = jest.spyOn(ApiService, "criarReserva").mockResolvedValue({} as never);
        preparar();
        await ReservaRemotaService.criar(reserva(), "ONLINE");
        expect(post).toHaveBeenCalledWith({ responsavelId: "RODRIGO", destino: "BOULEVARD", produtoId: "MIX", quantidade: 4 });
    });

    test("criação atualiza pelo snapshot", async () => {
        jest.spyOn(ApiService, "criarReserva").mockResolvedValue({} as never);
        preparar();
        expect((await ReservaRemotaService.criar(reserva(), "ONLINE")).reservas[0].id).toBe("backend-id");
    });

    test("criação persiste cache", async () => {
        jest.spyOn(ApiService, "criarReserva").mockResolvedValue({} as never);
        preparar();
        const dados = await ReservaRemotaService.criar(reserva(), "ONLINE");
        expect(PersistenceService.salvar).toHaveBeenCalledWith(dados);
    });

    test("erro na criação preserva estado e não executa regra local", async () => {
        const entrada = reserva();
        jest.spyOn(ApiService, "criarReserva").mockRejectedValue(new ErroApi("rejeitada", 422));
        const local = jest.spyOn(ReservaService, "criarReserva");
        await expect(ReservaRemotaService.criar(entrada, "ONLINE")).rejects.toThrow("rejeitada");
        expect(entrada).toEqual(reserva());
        expect(local).not.toHaveBeenCalled();
    });

    test("offline bloqueia criação", async () => {
        const post = jest.spyOn(ApiService, "criarReserva");
        await expect(ReservaRemotaService.criar(reserva(), "OFFLINE")).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
    });

    test("cancelamento válido chama endpoint correto", async () => {
        const post = jest.spyOn(ApiService, "cancelarReserva").mockResolvedValue({} as never);
        preparar(snapshot("CANCELADA"));
        await ReservaRemotaService.cancelar("uuid-real", "RODRIGO", "ONLINE");
        expect(post).toHaveBeenCalledWith("uuid-real", { responsavelId: "RODRIGO" });
    });

    test("cancelamento atualiza pelo snapshot", async () => {
        jest.spyOn(ApiService, "cancelarReserva").mockResolvedValue({} as never);
        preparar(snapshot("CANCELADA"));
        const dados = await ReservaRemotaService.cancelar("uuid-real", "RODRIGO", "ONLINE");
        expect(dados.reservas[0].status).toBe(StatusReserva.CANCELADA);
    });

    test("erro no cancelamento preserva estado", async () => {
        jest.spyOn(ApiService, "cancelarReserva").mockRejectedValue(new ErroApi("não cancelada", 409));
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        await expect(ReservaRemotaService.cancelar("id", "RODRIGO", "ONLINE")).rejects.toThrow("não cancelada");
        expect(obter).not.toHaveBeenCalled();
    });

    test("offline bloqueia cancelamento", async () => {
        const post = jest.spyOn(ApiService, "cancelarReserva");
        await expect(ReservaRemotaService.cancelar("id", "RODRIGO", "OFFLINE")).rejects.toThrow("offline");
        expect(post).not.toHaveBeenCalled();
    });

    test("toque duplo não gera duplicação", async () => {
        let concluir!: () => void;
        const espera = new Promise<void>((resolve) => { concluir = resolve; });
        const post = jest.spyOn(ApiService, "criarReserva").mockImplementation(async () => { await espera; return {} as never; });
        preparar();
        const primeira = ReservaRemotaService.criar(reserva(), "ONLINE");
        await expect(ReservaRemotaService.criar(reserva(), "ONLINE")).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });

    test("histórico e datas vêm do snapshot oficial", async () => {
        jest.spyOn(ApiService, "criarReserva").mockResolvedValue({} as never);
        preparar();
        const dados = await ReservaRemotaService.criar(reserva(), "ONLINE");
        expect(dados.reservas[0].historico?.[0].id).toBe("evento-backend");
        expect(dados.reservas[0].dataCriacao).toBeInstanceOf(Date);
        expect(dados.reservas[0].historico?.[0].data).toBeInstanceOf(Date);
    });
});
