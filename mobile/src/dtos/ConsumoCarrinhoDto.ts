export interface ItemConsumoCarrinhoRequestDto {
    produtoId: string;
    quantidade: number;
}

export interface RegistrarConsumoCarrinhoRequestDto {
    commandId: string;
    itens: ItemConsumoCarrinhoRequestDto[];
    data: string;
    observacao?: string;
}

export interface RegistrarConsumoCarrinhoResponseDto {
    revisao: number;
    id: string;
}
