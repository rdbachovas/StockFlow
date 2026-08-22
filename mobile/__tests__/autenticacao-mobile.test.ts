import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { UsuarioId } from "../src/models/Usuario";
import { ApiService, ErroApi } from "../src/services/ApiService";
import { AuthService } from "../src/services/AuthService";
import { SessaoService } from "../src/services/SessaoService";

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn()
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
}));

const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const usuario = { id: UsuarioId.RODRIGO, nome: "Rodrigo" };
const auth = (accessToken = "access-1", refreshToken = "refresh-1") => ({
    accessToken,
    refreshToken,
    expiresIn: 900,
    usuario
});

function resposta(status: number, corpo?: unknown): Response {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: jest.fn(async () => corpo)
    } as unknown as Response;
}

describe("autenticação mobile", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        SessaoService.reiniciarParaTestes();
        process.env.EXPO_PUBLIC_API_URL = "http://localhost:8080";
        secureStore.getItemAsync.mockResolvedValue(null);
        secureStore.setItemAsync.mockResolvedValue();
        secureStore.deleteItemAsync.mockResolvedValue();
        global.fetch = jest.fn() as unknown as typeof fetch;
    });

    test("login válido mantém access em memória e refresh no SecureStore", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(resposta(200, auth()));

        await expect(AuthService.login("rodrigo", "senha")).resolves.toEqual(usuario);

        expect(SessaoService.obterAccessToken()).toBe("access-1");
        expect(secureStore.setItemAsync).toHaveBeenCalledWith("stockflow.refresh-token", "refresh-1");
        expect(asyncStorage.setItem).not.toHaveBeenCalled();
        expect(JSON.stringify(asyncStorage.setItem.mock.calls)).not.toContain("access-1");
    });

    test("login inválido não persiste credenciais", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(resposta(401, {}));
        await expect(AuthService.login("rodrigo", "errada")).rejects.toBeInstanceOf(ErroApi);
        expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    });

    test("restaura sessão por refresh e confirma em /auth/me", async () => {
        secureStore.getItemAsync.mockResolvedValue("refresh-antigo");
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(200, auth("access-novo", "refresh-novo")))
            .mockResolvedValueOnce(resposta(200, usuario));

        await expect(AuthService.restaurarSessao()).resolves.toEqual(usuario);
        expect(SessaoService.obterAccessToken()).toBe("access-novo");
        expect(secureStore.setItemAsync).toHaveBeenCalledWith("stockflow.refresh-token", "refresh-novo");
        expect(jest.mocked(fetch).mock.calls[1][0]).toContain("/api/v1/auth/me");
    });

    test("refresh inválido encerra a sessão", async () => {
        secureStore.getItemAsync.mockResolvedValue("refresh-invalido");
        jest.mocked(fetch).mockResolvedValueOnce(resposta(401, {}));
        await expect(AuthService.restaurarSessao()).resolves.toBeUndefined();
        expect(secureStore.deleteItemAsync).toHaveBeenCalled();
        expect(SessaoService.obterAccessToken()).toBeUndefined();
    });

    test("logout revoga o refresh e limpa a memória sem tocar no AsyncStorage", async () => {
        await SessaoService.aplicar(auth());
        secureStore.getItemAsync.mockResolvedValue("refresh-1");
        jest.mocked(fetch).mockResolvedValueOnce(resposta(204));

        await AuthService.logout();

        expect(jest.mocked(fetch).mock.calls[0][0]).toContain("/api/v1/auth/logout");
        expect(SessaoService.obterAccessToken()).toBeUndefined();
        expect(secureStore.deleteItemAsync).toHaveBeenCalled();
        expect(asyncStorage.removeItem).not.toHaveBeenCalled();
    });

    test("401 coordena um único refresh e repete cada request uma vez", async () => {
        await SessaoService.aplicar(auth());
        secureStore.getItemAsync.mockResolvedValue("refresh-1");
        let liberarRefresh!: () => void;
        const espera = new Promise<void>((resolve) => { liberarRefresh = resolve; });
        jest.mocked(fetch).mockImplementation(async (entrada) => {
            const url = String(entrada);
            if (url.endsWith("/auth/refresh")) {
                await espera;
                return resposta(200, auth("access-2", "refresh-2"));
            }
            return SessaoService.obterAccessToken() === "access-1"
                ? resposta(401, {})
                : resposta(200, { revisao: 1 });
        });

        const primeira = ApiService.obterSnapshot();
        const segunda = ApiService.obterSnapshot();
        liberarRefresh();
        await Promise.all([primeira, segunda]);

        const urls = jest.mocked(fetch).mock.calls.map(([url]) => String(url));
        expect(urls.filter((url) => url.endsWith("/auth/refresh"))).toHaveLength(1);
        expect(urls.filter((url) => url.endsWith("/snapshot"))).toHaveLength(4);
    });

    test("403 não tenta refresh", async () => {
        await SessaoService.aplicar(auth());
        jest.mocked(fetch).mockResolvedValueOnce(resposta(403, {}));
        await expect(ApiService.obterSnapshot()).rejects.toMatchObject({ status: 403 });
        expect(jest.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    test("Bearer é centralizado e retry preserva o commandId", async () => {
        await SessaoService.aplicar(auth());
        secureStore.getItemAsync.mockResolvedValue("refresh-1");
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(401, {}))
            .mockResolvedValueOnce(resposta(200, auth("access-2", "refresh-2")))
            .mockResolvedValueOnce(resposta(200, { revisao: 2 }));

        await ApiService.registrarRetirada({
            commandId: "command-estavel",
            responsavelId: "RODRIGO",
            itens: [],
            data: new Date().toISOString()
        });

        const chamadasOperacao = jest.mocked(fetch).mock.calls.filter(([url]) =>
            String(url).endsWith("/api/v1/retiradas")
        );
        expect(chamadasOperacao).toHaveLength(2);
        expect(chamadasOperacao.map(([, init]) => JSON.parse(String(init?.body)).commandId))
            .toEqual(["command-estavel", "command-estavel"]);
        expect((chamadasOperacao[0][1]?.headers as Headers).get("Authorization"))
            .toBe("Bearer access-1");
        expect((chamadasOperacao[1][1]?.headers as Headers).get("Authorization"))
            .toBe("Bearer access-2");
    });

    test("falha no refresh encerra a sessão e não entra em loop", async () => {
        await SessaoService.aplicar(auth());
        secureStore.getItemAsync.mockResolvedValue("refresh-1");
        const encerramento = jest.fn();
        SessaoService.observarEncerramento(encerramento);
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(401, {}))
            .mockResolvedValueOnce(resposta(401, {}));

        await expect(ApiService.obterSnapshot()).rejects.toBeInstanceOf(ErroApi);
        expect(jest.mocked(fetch)).toHaveBeenCalledTimes(2);
        expect(encerramento).toHaveBeenCalled();
        expect(SessaoService.obterAccessToken()).toBeUndefined();
    });
});
