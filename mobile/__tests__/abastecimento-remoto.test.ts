import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { Abastecimento } from "../src/models/Abastecimento";
import { LocalId } from "../src/models/Local";
import { MaquinaId } from "../src/models/Maquina";
import { ProdutoId } from "../src/models/Produto";
import { AbastecimentoRemotoService } from "../src/services/AbastecimentoRemotoService";
import { OperacaoRemotaCoordinator } from "../src/services/OperacaoRemotaCoordinator";
import { AbastecimentoService } from "../src/services/AbastecimentoService";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { PersistenceService } from "../src/services/PersistenceService";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function abastecimento(
    localId: LocalId = LocalId.BOULEVARD,
    responsavelId: "RODRIGO" | "CESAR" = "RODRIGO",
    itens = [{ maquinaId: MaquinaId.M1, produtoId: ProdutoId.MIX, quantidade: 4 }]
): Abastecimento {
    return {
        id: "local",
        localId,
        responsavelId,
        itens,
        data: new Date("2026-08-17T12:00:00.000Z"),
        observacao: "Reposição"
    };
}

function snapshot(): SnapshotDto {
    return {
        revisao: 1,
        estoques: [
            { id: "ESTOQUE_PRINCIPAL", nome: "Principal", responsavelId: null, itens: [] },
            {
                id: "ESTOQUE_RODRIGO", nome: "Rodrigo", responsavelId: "RODRIGO",
                itens: [{ produtoId: "MIX", nome: "Mix", grupo: "PELUCIA", quantidade: 6 }]
            },
            { id: "ESTOQUE_CESAR", nome: "Cesar", responsavelId: "CESAR", itens: [] }
        ],
        reservas: [{
            id: "reserva-oficial", responsavelId: "RODRIGO", destino: "BOULEVARD",
            produtoId: "MIX", quantidade: 4, quantidadeUtilizada: 4,
            quantidadeLiberada: 0, quantidadeRestante: 0, status: "CONCLUIDA",
            dataCriacao: "2026-08-16T12:00:00Z",
            eventos: [{
                id: "uso-oficial", tipo: "UTILIZACAO", quantidade: 4,
                data: "2026-08-17T12:00:00Z"
            }]
        }],
        retiradas: [],
        abastecimentos: [{
            id: "abastecimento-oficial", responsavelId: "RODRIGO",
            estoqueOrigemId: "ESTOQUE_RODRIGO", local: "BOULEVARD",
            itens: [{ maquinaId: "M1", produtoId: "MIX", quantidade: 4 }],
            saldos: [{ produtoId: "MIX", quantidade: 4, saldoAnterior: 10, saldoPosterior: 6 }],
            data: "2026-08-17T12:00:00Z", observacao: "Reposição"
        }],
        devolucoes: [],
        movimentosEstoquePrincipal: [],
        consumosCarrinho: []
    };
}

function preparar(): void {
    jest.spyOn(ApiService, "registrarAbastecimento").mockResolvedValue({ revisao: 1 } as never);
    jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
}

describe("abastecimento remoto", () => {
    afterEach(() => {
        OperacaoRemotaCoordinator.descartarIntencaoAmbigua("abastecimento");
        jest.restoreAllMocks();
    });

    test("registra Boulevard remotamente", async () => {
        preparar();
        await AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE");
        expect(ApiService.registrarAbastecimento).toHaveBeenCalledWith({
            commandId: expect.any(String),
            local: "BOULEVARD",
            itens: [{ maquinaId: "M1", produtoId: "MIX", quantidade: 4 }],
            data: "2026-08-17T12:00:00.000Z", observacao: "Reposição"
        });
    });

    test("registra Aeroporto remotamente", async () => {
        preparar();
        const entrada = abastecimento(
            LocalId.AEROPORTO,
            "CESAR",
            [{ maquinaId: MaquinaId.B01, produtoId: ProdutoId.STITCH, quantidade: 3 }]
        );
        await AbastecimentoRemotoService.registrar(entrada, "ONLINE");
        expect(ApiService.registrarAbastecimento).toHaveBeenCalledWith(
            expect.objectContaining({ local: "AEROPORTO" })
        );
    });

    test.each(["RODRIGO", "CESAR"] as const)(
        "mercado por %s envia o local físico",
        async (responsavelId) => {
            preparar();
            const entrada = abastecimento(
                LocalId.GAUCHO_VICENTE_FONTOURA,
                responsavelId,
                [{
                    maquinaId: MaquinaId.GAUCHO_VICENTE_FONTOURA,
                    produtoId: ProdutoId.CAPIVARAS,
                    quantidade: 2
                }]
            );
            await AbastecimentoRemotoService.registrar(entrada, "ONLINE");
            expect(ApiService.registrarAbastecimento).toHaveBeenCalledWith(
                expect.objectContaining({
                    local: "GAUCHO_VICENTE_FONTOURA"
                })
            );
        }
    );

    test("Supermercado Fante permanece no histórico e consome reserva MERCADOS", async () => {
        const oficial = snapshot();
        oficial.abastecimentos[0].local = "SUPERMERCADO_FANTE";
        oficial.abastecimentos[0].itens[0].maquinaId = "SUPERMERCADO_FANTE";
        oficial.reservas[0].destino = "MERCADOS";
        jest.spyOn(ApiService, "registrarAbastecimento").mockResolvedValue({ revisao: 1 } as never);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(oficial);
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();

        const entrada = abastecimento(
            LocalId.SUPERMERCADO_FANTE,
            "RODRIGO",
            [{
                maquinaId: MaquinaId.SUPERMERCADO_FANTE,
                produtoId: ProdutoId.MIX,
                quantidade: 4
            }]
        );
        const resultado = await AbastecimentoRemotoService.registrar(entrada, "ONLINE");
        expect(resultado.tipo).toBe("CONFIRMADA");
        if (resultado.tipo !== "CONFIRMADA") return;
        const dados = resultado.dados;

        expect(ApiService.registrarAbastecimento).toHaveBeenCalledWith(
            expect.objectContaining({ local: "SUPERMERCADO_FANTE" })
        );
        expect(dados.abastecimentos[0].localId).toBe(LocalId.SUPERMERCADO_FANTE);
        expect(dados.reservas[0].destinoId).toBe("MERCADOS");
        expect(dados.reservas[0].quantidadeUtilizada).toBe(4);
    });

    test("envia múltiplos itens sem agregação local", async () => {
        preparar();
        const itens = [
            { maquinaId: MaquinaId.M1, produtoId: ProdutoId.MIX, quantidade: 2 },
            { maquinaId: MaquinaId.M2, produtoId: ProdutoId.PERSONAGENS, quantidade: 3 }
        ];
        await AbastecimentoRemotoService.registrar(
            abastecimento(LocalId.BOULEVARD, "RODRIGO", itens),
            "ONLINE"
        );
        expect(ApiService.registrarAbastecimento).toHaveBeenCalledWith(
            expect.objectContaining({ itens })
        );
    });

    test("aplica snapshot oficial, reserva consumida, estoque e cache", async () => {
        preparar();
        const resultado = await AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE");
        expect(resultado.tipo).toBe("CONFIRMADA");
        if (resultado.tipo !== "CONFIRMADA") return;
        const dados = resultado.dados;
        expect(dados.abastecimentos[0].id).toBe("abastecimento-oficial");
        expect(dados.reservas[0].quantidadeUtilizada).toBe(4);
        expect(dados.reservas[0].historico?.[0].id).toBe("uso-oficial");
        expect(dados.estoqueRodrigo.itens[0].quantidade).toBe(6);
        expect(PersistenceService.salvar).toHaveBeenCalledWith(dados);
    });

    test("offline bloqueia sem usar regra local", async () => {
        const remoto = jest.spyOn(ApiService, "registrarAbastecimento");
        const local = jest.spyOn(AbastecimentoService, "registrar");
        await expect(
            AbastecimentoRemotoService.registrar(abastecimento(), "OFFLINE")
        ).rejects.toThrow("offline");
        expect(remoto).not.toHaveBeenCalled();
        expect(local).not.toHaveBeenCalled();
    });

    test.each([400, 404, 409])(
        "erro HTTP %i não busca snapshot nem altera cache",
        async (status) => {
            jest.spyOn(ApiService, "registrarAbastecimento").mockRejectedValue(
                new ErroApi(`erro ${status}`, status)
            );
            const obter = jest.spyOn(ApiService, "obterSnapshot");
            const salvar = jest.spyOn(PersistenceService, "salvar");
            const local = jest.spyOn(AbastecimentoService, "registrar");
            await expect(
                AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE")
            ).rejects.toThrow(`erro ${status}`);
            expect(obter).not.toHaveBeenCalled();
            expect(salvar).not.toHaveBeenCalled();
            expect(local).not.toHaveBeenCalled();
        }
    );

    test("falha de rede não busca snapshot nem altera cache", async () => {
        jest.spyOn(ApiService, "registrarAbastecimento").mockRejectedValue(
            new ErroApi("Não foi possível conectar ao servidor.")
        );
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        await expect(
            AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE")
        ).rejects.toThrow("conectar");
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
    });

    test("dupla submissão gera somente um POST", async () => {
        let concluir!: () => void;
        const espera = new Promise<void>((resolve) => { concluir = resolve; });
        const post = jest.spyOn(ApiService, "registrarAbastecimento")
            .mockImplementation(async () => { await espera; return { revisao: 1 } as never; });
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const primeira = AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE");
        await expect(
            AbastecimentoRemotoService.registrar(abastecimento(), "ONLINE")
        ).rejects.toThrow("Já existe");
        concluir();
        await primeira;
        expect(post).toHaveBeenCalledTimes(1);
    });
});
