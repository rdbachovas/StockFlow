import { EstoqueItem } from "./EstoqueItem";

export interface Estoque {
  id: string;
  nome: string;
  itens: EstoqueItem[];
}