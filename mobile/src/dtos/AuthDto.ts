import { SessaoUsuario } from "../models/SessaoUsuario";

export interface AuthResponseDto {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    usuario: SessaoUsuario;
}

export interface LoginRequestDto {
    login: string;
    senha: string;
}

export interface RefreshRequestDto {
    refreshToken: string;
}
