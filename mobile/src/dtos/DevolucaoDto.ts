export interface ParcelaReservaDevolucaoRequestDto {
    destino: string;
    quantidade: number;
}

export interface ItemDevolucaoRequestDto {
    produtoId: string;
    quantidadeLivre: number;
    reservas: ParcelaReservaDevolucaoRequestDto[];
}

export interface RegistrarDevolucaoRequestDto {
    commandId: string;
    itens: ItemDevolucaoRequestDto[];
    data: string;
    observacao?: string;
}

export interface RegistrarDevolucaoResponseDto {
    revisao: number;
    id: string;
}
