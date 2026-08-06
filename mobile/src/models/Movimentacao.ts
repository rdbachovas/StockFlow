/*
Movimentação precisa responder: QUEM?
O QUÊ?
QUANTO?
DE ONDE?
PARA ONDE?
QUANDO?

isso aqui é uma classe apenas para fazer um modelo de dados, as regras de negócio vao estar em uma class Service.
*/

import { ProdutoId } from "./Produto";

export interface Movimentacao {
  id: string;
  produtoId: ProdutoId;
  quantidade: number;

  origemId: string;
  destinoId: string;

  responsavelId: string;
  data: Date;
}