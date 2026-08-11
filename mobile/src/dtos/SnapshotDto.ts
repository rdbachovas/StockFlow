export interface SnapshotEstoqueItemDto {
    produtoId: string;
    nome: string;
    grupo: string;
    quantidade: number;
}

export interface SnapshotEstoqueDto {
    id: string;
    nome: string;
    responsavelId: string | null;
    itens: SnapshotEstoqueItemDto[];
}

export interface SnapshotEventoReservaDto {
    id: string;
    tipo: string;
    quantidade: number;
    data: string;
}

export interface SnapshotReservaDto {
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
    eventos: SnapshotEventoReservaDto[];
}

export interface SnapshotMovimentoItemDto {
    produtoId: string;
    quantidade: number;
    saldoAnterior: number;
    saldoPosterior: number;
}

export interface SnapshotOperacaoDto {
    id: string;
    data: string;
    observacao: string | null;
}

export interface SnapshotRetiradaDto extends SnapshotOperacaoDto {
    responsavelId: string;
    estoqueOrigemId: string;
    estoqueDestinoId: string;
    itens: SnapshotMovimentoItemDto[];
}

export interface SnapshotAbastecimentoDto extends SnapshotOperacaoDto {
    responsavelId: string;
    estoqueOrigemId: string;
    local: string;
    itens: Array<{
        maquinaId: string;
        produtoId: string;
        quantidade: number;
    }>;
    saldos: SnapshotMovimentoItemDto[];
}

export interface SnapshotDevolucaoDto extends SnapshotOperacaoDto {
    responsavelId: string;
    estoqueOrigemId: string;
    estoqueDestinoId: string;
    itens: Array<{
        produtoId: string;
        quantidadeLivre: number;
        quantidadeReservada: number;
        quantidadeTotal: number;
        saldoPessoalAnterior: number;
        saldoPessoalPosterior: number;
        saldoPrincipalAnterior: number;
        saldoPrincipalPosterior: number;
        reservas: Array<{
            reservaId: string;
            destino: string;
            quantidade: number;
        }>;
    }>;
}

export interface SnapshotMovimentoPrincipalDto extends SnapshotOperacaoDto {
    tipo: string;
    itens: SnapshotMovimentoItemDto[];
}

export interface SnapshotConsumoCarrinhoDto extends SnapshotOperacaoDto {
    responsavelId: string;
    estoqueOrigemId: string;
    itens: SnapshotMovimentoItemDto[];
}

export interface SnapshotDto {
    estoques: SnapshotEstoqueDto[];
    reservas: SnapshotReservaDto[];
    retiradas: SnapshotRetiradaDto[];
    abastecimentos: SnapshotAbastecimentoDto[];
    devolucoes: SnapshotDevolucaoDto[];
    movimentosEstoquePrincipal: SnapshotMovimentoPrincipalDto[];
    consumosCarrinho: SnapshotConsumoCarrinhoDto[];
}
