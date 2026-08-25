import {
    AuthResponseDto,
    ChangePasswordRequestDto,
    LoginRequestDto
} from "../dtos/AuthDto";

export interface RequisicaoAuth {
    caminho: string;
    init: RequestInit;
}

export interface RefreshSessionAdapter {
    login(request: LoginRequestDto): Promise<RequisicaoAuth>;
    refresh(): Promise<RequisicaoAuth>;
    logout(): Promise<RequisicaoAuth>;
    changePassword(request: ChangePasswordRequestDto): Promise<RequisicaoAuth>;
    podeRestaurar(): Promise<boolean>;
    aplicarResposta(auth: AuthResponseDto): Promise<void>;
    limparSessao(): Promise<void>;
}

export function postJson(corpo: unknown): RequestInit {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    };
}
