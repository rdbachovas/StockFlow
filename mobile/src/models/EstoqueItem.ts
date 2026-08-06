import { ProdutoId } from "./Produto";

export interface EstoqueItem {
  produtoId: ProdutoId;
  quantidade: number;
}

//Usar a função map para transformar dados em JSON não é o ideal porque o map cria um novo array intermediário alocando memória extra, gasta tempo chamando funções de callback a cada item e estruturas como Map do JavaScript não são serializadas de forma nativa pelo JSON.stringify.