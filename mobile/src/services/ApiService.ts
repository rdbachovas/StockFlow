import { SnapshotDto } from "../dtos/SnapshotDto";
import {
    RegistrarAbastecimentoRequestDto,
    RegistrarAbastecimentoResponseDto
} from "../dtos/AbastecimentoDto";
import {
    RegistrarRetiradaRequestDto,
    RegistrarRetiradaResponseDto
} from "../dtos/RetiradaDto";
import {
    CancelarReservaRequestDto,
    CriarReservaRequestDto,
    ReservaResponseDto
} from "../dtos/ReservaDto";
import {
    RegistrarDevolucaoRequestDto,
    RegistrarDevolucaoResponseDto
} from "../dtos/DevolucaoDto";
import {
    RegistrarMovimentoEstoquePrincipalRequestDto,
    RegistrarMovimentoEstoquePrincipalResponseDto
} from "../dtos/MovimentoEstoquePrincipalDto";
import {
    RegistrarConsumoCarrinhoRequestDto,
    RegistrarConsumoCarrinhoResponseDto
} from "../dtos/ConsumoCarrinhoDto";

export class ErroApi extends Error {
    constructor(
        mensagem: string,
        readonly status?: number
    ) {
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
            // Mantém a mensagem controlada quando a resposta não contém JSON.
        }

        return new ErroApi(mensagem, resposta.status);
    }

    static async obterSnapshot(): Promise<SnapshotDto> {
        let resposta: Response;
        const url = `${this.apiUrl()}/api/v1/snapshot`;

        try {
            resposta = await fetch(url);
        } catch {
            throw new ErroApi("Não foi possível conectar ao servidor.");
        }


        if (!resposta.ok) {
            throw await this.erro(resposta);
        }

        return await resposta.json() as SnapshotDto;
    }

    static async registrarRetirada(
        retirada: RegistrarRetiradaRequestDto
    ): Promise<RegistrarRetiradaResponseDto> {
        let resposta: Response;
        const url = `${this.apiUrl()}/api/v1/retiradas`;

        try {
            resposta = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(retirada)
            });
        } catch {
            throw new ErroApi("Não foi possível conectar ao servidor.");
        }

        if (!resposta.ok) {
            throw await this.erro(resposta);
        }

        return await resposta.json() as RegistrarRetiradaResponseDto;
    }

    static async criarReserva(
        reserva: CriarReservaRequestDto
    ): Promise<ReservaResponseDto> {
        return await this.post<ReservaResponseDto>(
            "/api/v1/reservas",
            reserva
        );
    }

    static async cancelarReserva(
        reservaId: string,
        cancelamento: CancelarReservaRequestDto
    ): Promise<ReservaResponseDto> {
        return await this.post<ReservaResponseDto>(
            `/api/v1/reservas/${encodeURIComponent(reservaId)}/cancelamento`,
            cancelamento
        );
    }

    static async registrarAbastecimento(
        abastecimento: RegistrarAbastecimentoRequestDto
    ): Promise<RegistrarAbastecimentoResponseDto> {
        return await this.post<RegistrarAbastecimentoResponseDto>(
            "/api/v1/abastecimentos",
            abastecimento
        );
    }

    static async registrarDevolucao(
        devolucao: RegistrarDevolucaoRequestDto
    ): Promise<RegistrarDevolucaoResponseDto> {
        return await this.post<RegistrarDevolucaoResponseDto>(
            "/api/v1/devolucoes",
            devolucao
        );
    }

    static async registrarMovimentoEstoquePrincipal(
        movimento: RegistrarMovimentoEstoquePrincipalRequestDto
    ): Promise<RegistrarMovimentoEstoquePrincipalResponseDto> {
        return await this.post<RegistrarMovimentoEstoquePrincipalResponseDto>(
            "/api/v1/movimentos-estoque-principal",
            movimento
        );
    }

    static async registrarConsumoCarrinho(
        consumo: RegistrarConsumoCarrinhoRequestDto
    ): Promise<RegistrarConsumoCarrinhoResponseDto> {
        return await this.post<RegistrarConsumoCarrinhoResponseDto>(
            "/api/v1/consumos-carrinho",
            consumo
        );
    }

    private static async post<T>(
        caminho: string,
        corpo: unknown
    ): Promise<T> {
        let resposta: Response;

        try {
            resposta = await fetch(`${this.apiUrl()}${caminho}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(corpo)
            });
        } catch {
            throw new ErroApi("Não foi possível conectar ao servidor.");
        }

        if (!resposta.ok) {
            throw await this.erro(resposta);
        }

        return await resposta.json() as T;
    }
}
