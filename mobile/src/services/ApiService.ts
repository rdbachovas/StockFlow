import { AuthResponseDto, LoginRequestDto, RefreshRequestDto } from "../dtos/AuthDto";
import { RegistrarAbastecimentoRequestDto, RegistrarAbastecimentoResponseDto } from "../dtos/AbastecimentoDto";
import { RegistrarConsumoCarrinhoRequestDto, RegistrarConsumoCarrinhoResponseDto } from "../dtos/ConsumoCarrinhoDto";
import { RegistrarDevolucaoRequestDto, RegistrarDevolucaoResponseDto } from "../dtos/DevolucaoDto";
import { RegistrarMovimentoEstoquePrincipalRequestDto, RegistrarMovimentoEstoquePrincipalResponseDto } from "../dtos/MovimentoEstoquePrincipalDto";
import { CancelarReservaRequestDto, CriarReservaRequestDto, ReservaResponseDto } from "../dtos/ReservaDto";
import { RegistrarRetiradaRequestDto, RegistrarRetiradaResponseDto } from "../dtos/RetiradaDto";
import { SnapshotDto } from "../dtos/SnapshotDto";
import { SessaoUsuario } from "../models/SessaoUsuario";
import { SessaoService } from "./SessaoService";

export class ErroApi extends Error {
    constructor(mensagem: string, readonly status?: number) {
        super(mensagem);
        this.name = "ErroApi";
    }
}

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
        let resposta: Response;
        try {
            resposta = await fetch(url, { ...init, headers });
        } catch {
            throw new ErroApi("Não foi possível conectar ao servidor.");
        }

        if (resposta.status === 401 && autenticada && permitirRefresh) {
            if (SessaoService.obterAccessToken() === tokenEnviado) {
                await SessaoService.renovar((refreshToken) => this.refresh({ refreshToken }));
            }
            return await this.executar(caminho, init, true, false);
        }
        return resposta;
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

    static login(request: LoginRequestDto): Promise<AuthResponseDto> {
        return this.json("/api/v1/auth/login", this.postInit(request), false);
    }

    static refresh(request: RefreshRequestDto): Promise<AuthResponseDto> {
        return this.json("/api/v1/auth/refresh", this.postInit(request), false);
    }

    static logout(request: RefreshRequestDto): Promise<void> {
        return this.semConteudo("/api/v1/auth/logout", this.postInit(request));
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
