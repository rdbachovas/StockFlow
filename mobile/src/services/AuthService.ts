import { AuthResponseDto } from "../dtos/AuthDto";
import { SessaoUsuario } from "../models/SessaoUsuario";
import { ApiService } from "./ApiService";
import { SessaoService } from "./SessaoService";
import { ErroApi } from "./ErroApi";
import { refreshSessionAdapter } from "./RefreshSessionAdapter";

export class AuthService {
    static async login(login: string, senha: string): Promise<SessaoUsuario> {
        const auth = await ApiService.login({ login, senha });
        await SessaoService.aplicar(auth);
        return auth.usuario;
    }

    static async restaurarSessao(): Promise<SessaoUsuario | undefined> {
        if (!await refreshSessionAdapter.podeRestaurar()) {
            return undefined;
        }

        try {
            await SessaoService.renovar(() => ApiService.refresh());
            const usuario = await ApiService.me();
            SessaoService.definirUsuario(usuario);
            return usuario;
        } catch (erro) {
            if (
                erro instanceof ErroApi &&
                (erro.status === 400 || erro.tipo === "HTTP_401")
            ) {
                return undefined;
            }
            throw erro;
        }
    }

    static async renovar(): Promise<AuthResponseDto> {
        return await ApiService.refresh();
    }

    static async logout(): Promise<void> {
        try {
            if (
                await refreshSessionAdapter.podeRestaurar() &&
                SessaoService.obterAccessToken()
            ) {
                await ApiService.logout();
            }
        } finally {
            await SessaoService.encerrar();
        }
    }

    static async alterarSenha(
        senhaAtual: string,
        novaSenha: string
    ): Promise<void> {
        await ApiService.alterarSenha({ senhaAtual, novaSenha });
        await SessaoService.encerrar();
    }
}
