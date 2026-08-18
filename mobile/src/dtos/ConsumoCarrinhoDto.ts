export interface ItemConsumoCarrinhoRequestDto {
    produtoId: string;
    quantidade: number;
}

export interface RegistrarConsumoCarrinhoRequestDto {
    responsavelId: string;
    itens: ItemConsumoCarrinhoRequestDto[];
    data: string;
    observacao?: string;
}

export interface RegistrarConsumoCarrinhoResponseDto {
    id: string;
}
