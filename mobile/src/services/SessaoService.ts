import { AuthResponseDto } from "../dtos/AuthDto";
import { SessaoUsuario } from "../models/SessaoUsuario";
import { ErroApi } from "./ErroApi";
import { refreshSessionAdapter } from "./RefreshSessionAdapter";

type OuvinteEncerramento = () => void;

export class SessaoService {
    private static accessToken?: string;
    private static usuario?: SessaoUsuario;
    private static renovacao?: Promise<AuthResponseDto>;
    private static ouvintes = new Set<OuvinteEncerramento>();

    static obterAccessToken(): string | undefined {
        return this.accessToken;
    }

    static obterUsuario(): SessaoUsuario | undefined {
        return this.usuario;
    }

    static observarEncerramento(ouvinte: OuvinteEncerramento): () => void {
        this.ouvintes.add(ouvinte);
        return () => this.ouvintes.delete(ouvinte);
    }

    static async aplicar(auth: AuthResponseDto): Promise<void> {
        await refreshSessionAdapter.aplicarResposta(auth);
        this.accessToken = auth.accessToken;
        this.usuario = auth.usuario;
    }

    static definirUsuario(usuario: SessaoUsuario): void {
        this.usuario = usuario;
    }

    static renovar(executor: () => Promise<AuthResponseDto>): Promise<AuthResponseDto> {
        if (this.renovacao !== undefined) {
            return this.renovacao;
        }

        this.renovacao = this.renovarInternamente(executor).finally(() => {
            this.renovacao = undefined;
        });
        return this.renovacao;
    }

    private static async renovarInternamente(
        executor: () => Promise<AuthResponseDto>
    ): Promise<AuthResponseDto> {
        if (!await refreshSessionAdapter.podeRestaurar()) {
            await this.encerrar();
            throw new Error("Sessão expirada.");
        }

        try {
            const auth = await executor();
            await this.aplicar(auth);
            return auth;
        } catch (erro) {
            if (
                erro instanceof ErroApi &&
                (erro.status === 400 || erro.tipo === "HTTP_401")
            ) {
                await this.encerrar();
            }
            throw erro;
        }
    }

    static async encerrar(): Promise<void> {
        this.accessToken = undefined;
        this.usuario = undefined;
        await refreshSessionAdapter.limparSessao();
        this.ouvintes.forEach((ouvinte) => ouvinte());
    }

    static reiniciarParaTestes(): void {
        this.accessToken = undefined;
        this.usuario = undefined;
        this.renovacao = undefined;
        this.ouvintes.clear();
    }
}
