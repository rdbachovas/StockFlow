import { EstoqueItem } from "./EstoqueItem";

export interface Estoque {
    id: string;
    nome: string;
    responsavelId?: string;
    itens: EstoqueItem[];
}
