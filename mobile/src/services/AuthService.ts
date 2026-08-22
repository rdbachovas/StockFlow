import { AuthResponseDto } from "../dtos/AuthDto";
import { SessaoUsuario } from "../models/SessaoUsuario";
import { ApiService } from "./ApiService";
import { SessaoService } from "./SessaoService";
import { TokenStorageService } from "./TokenStorageService";

export class AuthService {
    static async login(login: string, senha: string): Promise<SessaoUsuario> {
        const auth = await ApiService.login({ login, senha });
        await SessaoService.aplicar(auth);
        return auth.usuario;
    }

    static async restaurarSessao(): Promise<SessaoUsuario | undefined> {
        const refreshToken = await TokenStorageService.obterRefreshToken();
        if (!refreshToken) {
            return undefined;
        }

        try {
            await SessaoService.renovar((token) => ApiService.refresh({
                refreshToken: token
            }));
            const usuario = await ApiService.me();
            SessaoService.definirUsuario(usuario);
            return usuario;
        } catch {
            await SessaoService.encerrar();
            return undefined;
        }
    }

    static async renovar(refreshToken: string): Promise<AuthResponseDto> {
        return await ApiService.refresh({ refreshToken });
    }

    static async logout(): Promise<void> {
        const refreshToken = await TokenStorageService.obterRefreshToken();
        try {
            if (refreshToken && SessaoService.obterAccessToken()) {
                await ApiService.logout({ refreshToken });
            }
        } finally {
            await SessaoService.encerrar();
        }
    }
}
