import { ChangePasswordRequestDto, LoginRequestDto } from "../dtos/AuthDto";
import {
    postJson,
    RefreshSessionAdapter
} from "./RefreshSessionAdapter.types";

const incluirCookie = (init: RequestInit): RequestInit => ({
    ...init,
    credentials: "include"
});

export const refreshSessionAdapter: RefreshSessionAdapter = {
    async login(request: LoginRequestDto) {
        return {
            caminho: "/api/v1/auth/web/login",
            init: incluirCookie(postJson(request))
        };
    },

    async refresh() {
        return {
            caminho: "/api/v1/auth/web/refresh",
            init: incluirCookie({ method: "POST" })
        };
    },

    async logout() {
        return {
            caminho: "/api/v1/auth/web/logout",
            init: incluirCookie({ method: "POST" })
        };
    },

    async changePassword(request: ChangePasswordRequestDto) {
        return {
            caminho: "/api/v1/auth/change-password",
            init: incluirCookie(postJson(request))
        };
    },

    async podeRestaurar() {
        return true;
    },

    async aplicarResposta() {
        // O navegador recebe e persiste o cookie HttpOnly sem acesso do JavaScript.
    },

    async limparSessao() {
        // Somente o backend pode criar ou expirar o cookie HttpOnly.
    }
};
