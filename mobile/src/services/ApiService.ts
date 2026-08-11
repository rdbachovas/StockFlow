import { SnapshotDto } from "../dtos/SnapshotDto";
import {
    RegistrarRetiradaRequestDto,
    RegistrarRetiradaResponseDto
} from "../dtos/RetiradaDto";
import {
    CancelarReservaRequestDto,
    CriarReservaRequestDto,
    ReservaResponseDto
} from "../dtos/ReservaDto";

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
        let mensagem = `Operação rejeitada pelo servidor (HTTP ${resposta.status}).`;

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

        try {
            resposta = await fetch(`${this.apiUrl()}/api/v1/snapshot`);
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

        try {
            resposta = await fetch(`${this.apiUrl()}/api/v1/retiradas`, {
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
