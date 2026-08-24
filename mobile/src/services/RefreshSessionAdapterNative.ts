import { AuthResponseDto, LoginRequestDto } from "../dtos/AuthDto";
import { TokenStorageService } from "./TokenStorageService";
import {
    postJson,
    RefreshSessionAdapter
} from "./RefreshSessionAdapter.types";

export const refreshSessionAdapterNative: RefreshSessionAdapter = {
    async login(request: LoginRequestDto) {
        return { caminho: "/api/v1/auth/login", init: postJson(request) };
    },

    async refresh() {
        const refreshToken = await TokenStorageService.obterRefreshToken();
        return {
            caminho: "/api/v1/auth/refresh",
            init: postJson({ refreshToken: refreshToken ?? "" })
        };
    },

    async logout() {
        const refreshToken = await TokenStorageService.obterRefreshToken();
        return {
            caminho: "/api/v1/auth/logout",
            init: postJson({ refreshToken: refreshToken ?? "" })
        };
    },

    async podeRestaurar() {
        return (await TokenStorageService.obterRefreshToken()) !== null;
    },

    async aplicarResposta(auth: AuthResponseDto) {
        if (!auth.refreshToken) {
            throw new Error("O backend Native não retornou o refresh token.");
        }
        await TokenStorageService.salvarRefreshToken(auth.refreshToken);
    },

    async limparSessao() {
        await TokenStorageService.removerRefreshToken();
    }
};
