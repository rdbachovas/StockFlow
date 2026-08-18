import { afterEach, describe, expect, jest, test } from "@jest/globals";

import { SnapshotDto } from "../src/dtos/SnapshotDto";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { OperacaoRemotaCoordinator } from "../src/services/OperacaoRemotaCoordinator";
import { PersistenceService } from "../src/services/PersistenceService";
import { SnapshotMapper } from "../src/services/SnapshotMapper";

jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn() }
}));

function snapshot(): SnapshotDto {
    return {
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

function preparar(): void {
    jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
    jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
}

describe("OperacaoRemotaCoordinator", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("operações de tipos diferentes usam uma fila global e B espera A", async () => {
        preparar();
        const ordem: string[] = [];
        let concluirA!: () => void;
        const esperaA = new Promise<void>((resolve) => { concluirA = resolve; });
        const operacaoA = OperacaoRemotaCoordinator.executar(async () => {
            ordem.push("post A iniciou");
            await esperaA;
            ordem.push("post A terminou");
        }, "ONLINE");
        const operacaoB = OperacaoRemotaCoordinator.executar(async () => {
            ordem.push("post B iniciou");
        }, "ONLINE");

        await Promise.resolve();
        expect(ordem).toEqual(["post A iniciou"]);
        concluirA();
        await Promise.all([operacaoA, operacaoB]);
        expect(ordem).toEqual(["post A iniciou", "post A terminou", "post B iniciou"]);
    });

    test("POST rejeitado não busca snapshot, não persiste e restaura estado", async () => {
        const obter = jest.spyOn(ApiService, "obterSnapshot");
        const salvar = jest.spyOn(PersistenceService, "salvar");
        const estados: string[] = [];
        const resultado = await OperacaoRemotaCoordinator.executar(
            async () => { throw new ErroApi("rejeitada", 409); },
            "ONLINE",
            (estado) => estados.push(estado)
        );
        expect(resultado.tipo).toBe("REJEITADA");
        expect(obter).not.toHaveBeenCalled();
        expect(salvar).not.toHaveBeenCalled();
        expect(estados).toEqual(["SINCRONIZANDO", "ONLINE"]);
    });

    test("POST confirmado e snapshot válido atualizam estado e persistem uma vez", async () => {
        preparar();
        const estados: string[] = [];
        const resultado = await OperacaoRemotaCoordinator.executar(
            async () => undefined,
            "ONLINE",
            (estado) => estados.push(estado)
        );
        expect(resultado.tipo).toBe("CONFIRMADA");
        expect(estados).toEqual(["SINCRONIZANDO", "ONLINE"]);
        expect(PersistenceService.salvar).toHaveBeenCalledTimes(1);
    });

    test("GET falha após POST, fica pendente e nova tentativa repete somente GET", async () => {
        const post = jest.fn(async () => undefined);
        jest.spyOn(ApiService, "obterSnapshot").mockRejectedValueOnce(new ErroApi("sem rede"));
        const salvar = jest.spyOn(PersistenceService, "salvar").mockResolvedValue();
        const primeiro = await OperacaoRemotaCoordinator.executar(post, "ONLINE");
        expect(primeiro.tipo).toBe("CONFIRMADA_PENDENTE_SNAPSHOT");
        expect(post).toHaveBeenCalledTimes(1);
        expect(salvar).not.toHaveBeenCalled();

        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValueOnce(snapshot());
        const segundo = await OperacaoRemotaCoordinator.sincronizarPendente();
        expect(segundo.tipo).toBe("CONFIRMADA");
        expect(post).toHaveBeenCalledTimes(1);
        expect(ApiService.obterSnapshot).toHaveBeenCalledTimes(2);
    });

    test("falha do SnapshotMapper após POST não repete POST", async () => {
        const post = jest.fn(async () => undefined);
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(SnapshotMapper, "paraDadosIniciais").mockImplementationOnce(() => {
            throw new Error("snapshot inválido");
        });
        const resultado = await OperacaoRemotaCoordinator.executar(post, "ONLINE");
        expect(resultado.tipo).toBe("CONFIRMADA_PENDENTE_SNAPSHOT");
        expect(post).toHaveBeenCalledTimes(1);

        const recuperado = await OperacaoRemotaCoordinator.sincronizarPendente();
        expect(recuperado.tipo).toBe("CONFIRMADA");
        expect(post).toHaveBeenCalledTimes(1);
    });

    test("falha do AsyncStorage mantém confirmação e entrega dados oficiais", async () => {
        jest.spyOn(ApiService, "obterSnapshot").mockResolvedValue(snapshot());
        jest.spyOn(PersistenceService, "salvar").mockRejectedValue(new Error("cache indisponível"));
        const resultado = await OperacaoRemotaCoordinator.executar(async () => undefined, "ONLINE");
        expect(resultado.tipo).toBe("CONFIRMADA");
        if (resultado.tipo !== "CONFIRMADA") return;
        expect(resultado.cacheAtualizado).toBe(false);
        expect(resultado.dados.estoquePrincipal.id).toBe("ESTOQUE_PRINCIPAL");
    });

    test("estado não online rejeita antes do POST", async () => {
        const post = jest.fn(async () => undefined);
        const resultado = await OperacaoRemotaCoordinator.executar(post, "OFFLINE");
        expect(resultado.tipo).toBe("REJEITADA");
        expect(post).not.toHaveBeenCalled();
    });

    test("falha de rede no POST muda o estado para offline", async () => {
        const estados: string[] = [];
        const resultado = await OperacaoRemotaCoordinator.executar(
            async () => { throw new ErroApi("sem rede"); },
            "ONLINE",
            (estado) => estados.push(estado)
        );
        expect(resultado.tipo).toBe("REJEITADA");
        expect(estados).toEqual(["SINCRONIZANDO", "OFFLINE"]);
    });
});
