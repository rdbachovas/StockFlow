import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

jest.mock("../src/services/RefreshSessionAdapter", () =>
    jest.requireActual("../src/services/RefreshSessionAdapter.web")
);
jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn()
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
    __esModule: true,
    default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
}));

import { UsuarioId } from "../src/models/Usuario";
import { ApiService } from "../src/services/ApiService";
import { AuthService } from "../src/services/AuthService";
import { SessaoService } from "../src/services/SessaoService";

const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const asyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const usuario = { id: UsuarioId.RODRIGO, nome: "Rodrigo" };
const authWeb = (accessToken = "access-web") => ({
    accessToken,
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

describe("autenticação Web por cookie HttpOnly", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        SessaoService.reiniciarParaTestes();
        process.env.EXPO_PUBLIC_API_URL = "https://api.stockflow.test";
        process.env.EXPO_PUBLIC_API_TIMEOUT_MS = "10000";
        global.fetch = jest.fn() as unknown as typeof fetch;
    });

    test("login usa credentials include e não persiste refresh via JavaScript", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(resposta(200, authWeb()));

        await expect(AuthService.login("rodrigo", "senha")).resolves
            .toEqual(usuario);

        const [url, init] = jest.mocked(fetch).mock.calls[0];
        expect(String(url)).toContain("/api/v1/auth/web/login");
        expect(init?.credentials).toBe("include");
        expect(SessaoService.obterAccessToken()).toBe("access-web");
        expect(secureStore.setItemAsync).not.toHaveBeenCalled();
        expect(asyncStorage.setItem).not.toHaveBeenCalled();
    });

    test("reload restaura sessão via refresh com cookie e depois confirma /me", async () => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(200, authWeb("access-restaurado")))
            .mockResolvedValueOnce(resposta(200, usuario));

        await expect(AuthService.restaurarSessao()).resolves.toEqual(usuario);

        const [refreshUrl, refreshInit] = jest.mocked(fetch).mock.calls[0];
        expect(String(refreshUrl)).toContain("/api/v1/auth/web/refresh");
        expect(refreshInit?.credentials).toBe("include");
        expect(refreshInit?.body).toBeUndefined();
        expect(SessaoService.obterAccessToken()).toBe("access-restaurado");
        expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    });

    test("sessão inválida retorna ao login sem armazenamento JavaScript", async () => {
        jest.mocked(fetch).mockResolvedValueOnce(resposta(401, {}));

        await expect(AuthService.restaurarSessao()).resolves.toBeUndefined();

        expect(SessaoService.obterAccessToken()).toBeUndefined();
        expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
        expect(asyncStorage.removeItem).not.toHaveBeenCalled();
    });

    test("indisponibilidade permite retry posterior sem apagar sessão Web", async () => {
        jest.mocked(fetch)
            .mockRejectedValueOnce(new TypeError("sem rede"))
            .mockResolvedValueOnce(resposta(200, authWeb("access-retry")))
            .mockResolvedValueOnce(resposta(200, usuario));

        await expect(AuthService.restaurarSessao()).rejects.toMatchObject({
            tipo: "REDE_INDISPONIVEL"
        });
        await expect(AuthService.restaurarSessao()).resolves.toEqual(usuario);

        expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
        expect(SessaoService.obterAccessToken()).toBe("access-retry");
    });

    test("logout usa cookie, limpa access em memória e preserva fila", async () => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(200, authWeb()))
            .mockResolvedValueOnce(resposta(204));
        await AuthService.login("rodrigo", "senha");

        await AuthService.logout();

        const [url, init] = jest.mocked(fetch).mock.calls[1];
        expect(String(url)).toContain("/api/v1/auth/web/logout");
        expect(init?.credentials).toBe("include");
        expect(SessaoService.obterAccessToken()).toBeUndefined();
        expect(asyncStorage.removeItem).not.toHaveBeenCalled();
        expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    test("troca de senha Web inclui cookie e não persiste token via JS", async () => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(200, authWeb()))
            .mockResolvedValueOnce(resposta(204));
        await AuthService.login("rodrigo", "senha");

        await AuthService.alterarSenha("senha", "nova senha definitiva");

        const [url, init] = jest.mocked(fetch).mock.calls[1];
        expect(String(url)).toContain("/api/v1/auth/change-password");
        expect(init?.credentials).toBe("include");
        expect(SessaoService.obterAccessToken()).toBeUndefined();
        expect(secureStore.setItemAsync).not.toHaveBeenCalled();
        expect(asyncStorage.removeItem).not.toHaveBeenCalled();
    });

    test("requests comuns continuam usando somente Bearer", async () => {
        jest.mocked(fetch)
            .mockResolvedValueOnce(resposta(200, authWeb()))
            .mockResolvedValueOnce(resposta(200, { revisao: 1 }));
        await AuthService.login("rodrigo", "senha");

        await ApiService.obterSnapshot();

        const [, init] = jest.mocked(fetch).mock.calls[1];
        expect(init?.credentials).toBeUndefined();
        expect((init?.headers as Headers).get("Authorization"))
            .toBe("Bearer access-web");
    });
});
