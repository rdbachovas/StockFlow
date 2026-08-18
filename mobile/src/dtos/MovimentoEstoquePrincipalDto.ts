export interface ItemMovimentoEstoquePrincipalRequestDto {
    produtoId: string;
    quantidade: number;
}

export interface RegistrarMovimentoEstoquePrincipalRequestDto {
    tipo: "ENTRADA" | "SAIDA";
    itens: ItemMovimentoEstoquePrincipalRequestDto[];
    data: string;
    observacao?: string;
}

export interface RegistrarMovimentoEstoquePrincipalResponseDto {
    revisao: number;
    id: string;
}
