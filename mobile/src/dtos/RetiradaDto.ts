export interface RegistrarRetiradaRequestDto {
    responsavelId: string;
    itens: Array<{
        produtoId: string;
        quantidade: number;
    }>;
    data: string;
    observacao?: string;
}

export interface RegistrarRetiradaResponseDto {
    id: string;
    responsavelId: string;
    estoqueOrigemId: string;
    estoqueDestinoId: string;
    itens: Array<{
        produtoId: string;
        quantidade: number;
        saldoAnterior: number;
        saldoPosterior: number;
    }>;
    data: string;
    observacao: string | null;
}
