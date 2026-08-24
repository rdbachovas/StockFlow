export interface RegistrarAbastecimentoRequestDto {
    commandId: string;
    local: string;
    itens: Array<{
        maquinaId: string;
        produtoId: string;
        quantidade: number;
    }>;
    data: string;
    observacao?: string;
}

export interface RegistrarAbastecimentoResponseDto {
    revisao: number;
    id: string;
    responsavelId: string;
    estoqueOrigemId: string;
    local: string;
    itens: Array<{
        maquinaId: string;
        produtoId: string;
        quantidade: number;
    }>;
    saldos: Array<{
        produtoId: string;
        quantidade: number;
        saldoAnterior: number;
        saldoPosterior: number;
    }>;
    data: string;
    observacao?: string;
}
