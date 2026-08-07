export enum UsuarioId {
    RODRIGO = "RODRIGO",
    CESAR = "CESAR",
}

export interface Usuario {
    id: UsuarioId;
    nome: string;
    estoqueId: string;
}