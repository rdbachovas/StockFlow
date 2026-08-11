export interface CriarReservaRequestDto {
    responsavelId: string;
    destino: string;
    produtoId: string;
    quantidade: number;
}

export interface CancelarReservaRequestDto {
    responsavelId: string;
}

export interface ReservaResponseDto {
    id: string;
    responsavelId: string;
    destino: string;
    produtoId: string;
    quantidade: number;
    quantidadeUtilizada: number;
    quantidadeLiberada: number;
    quantidadeRestante: number;
    status: string;
    dataCriacao: string;
    eventos: Array<{
        id: string;
        tipo: string;
        quantidade: number;
        data: string;
    }>;
}
