import { AuthResponseDto, LoginRequestDto } from "../dtos/AuthDto";
import { RegistrarAbastecimentoRequestDto, RegistrarAbastecimentoResponseDto } from "../dtos/AbastecimentoDto";
import { RegistrarConsumoCarrinhoRequestDto, RegistrarConsumoCarrinhoResponseDto } from "../dtos/ConsumoCarrinhoDto";
import { RegistrarDevolucaoRequestDto, RegistrarDevolucaoResponseDto } from "../dtos/DevolucaoDto";
import { RegistrarMovimentoEstoquePrincipalRequestDto, RegistrarMovimentoEstoquePrincipalResponseDto } from "../dtos/MovimentoEstoquePrincipalDto";
import { CancelarReservaRequestDto, CriarReservaRequestDto, ReservaResponseDto } from "../dtos/ReservaDto";
import { RegistrarRetiradaRequestDto, RegistrarRetiradaResponseDto } from "../dtos/RetiradaDto";
import { SnapshotDto } from "../dtos/SnapshotDto";
import { SessaoUsuario } from "../models/SessaoUsuario";
import { SessaoService } from "./SessaoService";
import { ErroApi } from "./ErroApi";
import { refreshSessionAdapter } from "./RefreshSessionAdapter";

export { ErroApi } from "./ErroApi";

export class ApiService {
    private static apiUrl(): string {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
        if (!apiUrl) {
            throw new ErroApi("Servidor não configurado.");
        }
        return apiUrl;
    }

    private static async erro(resposta: Response): Promise<ErroApi> {
        const mensagens: Record<number, string> = {
            400: "Os dados enviados são inválidos ou a operação não pode ser realizada.",
            401: "Credenciais ou sessão inválidas.",
            403: "Você não tem permissão para realizar esta operação.",
            404: "O recurso informado não foi encontrado.",
            409: "A operação entrou em conflito com o estado atual. Atualize e tente novamente."
        };
        let mensagem = mensagens[resposta.status] ??
            `Operação rejeitada pelo servidor (HTTP ${resposta.status}).`;
        try {
            const corpo = await resposta.json() as Record<string, unknown>;
            const detalhe = corpo.detail ?? corpo.message ?? corpo.error;
            if (typeof detalhe === "string" && detalhe.trim()) {
                mensagem = detalhe;
            }
        } catch {
            // Mantém mensagem controlada para respostas sem JSON.
        }
        return new ErroApi(mensagem, resposta.status);
    }

    private static async executar(
        caminho: string,
        init: RequestInit,
        autenticada: boolean,
        permitirRefresh: boolean
    ): Promise<Response> {
        const tokenEnviado = autenticada ? SessaoService.obterAccessToken() : undefined;
        const headers = new Headers(init.headers);
        if (tokenEnviado) {
            headers.set("Authorization", `Bearer ${tokenEnviado}`);
        }

        const url = `${this.apiUrl()}${caminho}`;
        const controller = new AbortController();
        const timeoutMs = this.timeoutMs();
        let expirou = false;
        const timeout = setTimeout(() => {
            expirou = true;
            controller.abort();
        }, timeoutMs);

        let resposta: Response;
        try {
            resposta = await fetch(url, {
                ...init,
                headers,
                signal: controller.signal
            });
        } catch {
            if (expirou) {
                throw new ErroApi(
                    "O servidor demorou demais para responder.",
                    undefined,
                    "TIMEOUT"
                );
            }
            throw new ErroApi(
                "Não foi possível conectar ao servidor.",
                undefined,
                "REDE_INDISPONIVEL"
            );
        } finally {
            clearTimeout(timeout);
        }

        if (resposta.status === 401 && autenticada && permitirRefresh) {
            if (SessaoService.obterAccessToken() === tokenEnviado) {
                await SessaoService.renovar(() => this.refresh());
            }
            return await this.executar(caminho, init, true, false);
        }
        return resposta;
    }

    private static timeoutMs(): number {
        const configurado = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
        return Number.isFinite(configurado) && configurado > 0
            ? configurado
            : 10000;
    }

    private static async json<T>(
        caminho: string,
        init: RequestInit = {},
        autenticada = true
    ): Promise<T> {
        const resposta = await this.executar(caminho, init, autenticada, autenticada);
        if (!resposta.ok) {
            throw await this.erro(resposta);
        }
        return await resposta.json() as T;
    }

    private static async semConteudo(caminho: string, init: RequestInit): Promise<void> {
        const resposta = await this.executar(caminho, init, true, true);
        if (!resposta.ok) {
            throw await this.erro(resposta);
        }
    }

    private static postInit(corpo: unknown): RequestInit {
        return {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        };
    }

    static async login(request: LoginRequestDto): Promise<AuthResponseDto> {
        const requisicao = await refreshSessionAdapter.login(request);
        return await this.json(requisicao.caminho, requisicao.init, false);
    }

    static async refresh(): Promise<AuthResponseDto> {
        const requisicao = await refreshSessionAdapter.refresh();
        return await this.json(requisicao.caminho, requisicao.init, false);
    }

    static async logout(): Promise<void> {
        const requisicao = await refreshSessionAdapter.logout();
        return await this.semConteudo(requisicao.caminho, requisicao.init);
    }

    static me(): Promise<SessaoUsuario> {
        return this.json("/api/v1/auth/me");
    }

    static obterSnapshot(): Promise<SnapshotDto> {
        return this.json("/api/v1/snapshot");
    }

    static registrarRetirada(retirada: RegistrarRetiradaRequestDto): Promise<RegistrarRetiradaResponseDto> {
        return this.json("/api/v1/retiradas", this.postInit(retirada));
    }

    static criarReserva(reserva: CriarReservaRequestDto): Promise<ReservaResponseDto> {
        return this.json("/api/v1/reservas", this.postInit(reserva));
    }

    static cancelarReserva(reservaId: string, cancelamento: CancelarReservaRequestDto): Promise<ReservaResponseDto> {
        return this.json(`/api/v1/reservas/${encodeURIComponent(reservaId)}/cancelamento`, this.postInit(cancelamento));
    }

    static registrarAbastecimento(abastecimento: RegistrarAbastecimentoRequestDto): Promise<RegistrarAbastecimentoResponseDto> {
        return this.json("/api/v1/abastecimentos", this.postInit(abastecimento));
    }

    static registrarDevolucao(devolucao: RegistrarDevolucaoRequestDto): Promise<RegistrarDevolucaoResponseDto> {
        return this.json("/api/v1/devolucoes", this.postInit(devolucao));
    }

    static registrarMovimentoEstoquePrincipal(movimento: RegistrarMovimentoEstoquePrincipalRequestDto): Promise<RegistrarMovimentoEstoquePrincipalResponseDto> {
        return this.json("/api/v1/movimentos-estoque-principal", this.postInit(movimento));
    }

    static registrarConsumoCarrinho(consumo: RegistrarConsumoCarrinhoRequestDto): Promise<RegistrarConsumoCarrinhoResponseDto> {
        return this.json("/api/v1/consumos-carrinho", this.postInit(consumo));
    }
}
