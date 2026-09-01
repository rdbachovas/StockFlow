# Backend e API

## Estrutura Spring Boot

```text
HTTP → Controllers → Services transacionais → Repositories/JdbcTemplate → PostgreSQL
```

Controllers validam DTOs e status HTTP. Services aplicam regras, identidade,
locks, idempotência e revisão. Repositories fazem persistência. A API usa prefixo
`/api/v1`; endpoints operacionais exigem Bearer JWT.

## Autenticação

| Método e path | Autenticação | Conceito |
| --- | --- | --- |
| `POST /auth/login` | pública/Native | login+senha → access, refresh e usuário |
| `POST /auth/refresh` | pública/Native | refresh no JSON → rotação |
| `POST /auth/logout` | Bearer/Native | refresh no JSON → revogação, 204 |
| `POST /auth/web/login` | pública/Web+Origin | login → access/usuário; refresh em cookie |
| `POST /auth/web/refresh` | pública/Web+Origin | cookie → rotação e novo cookie |
| `POST /auth/web/logout` | Bearer/Web+Origin | revoga/expira cookie, 204 |
| `GET /auth/me` | Bearer | usuário e flag de troca |
| `POST /auth/change-password` | Bearer | senha atual/nova; revoga sessões, 204 |

## Leitura oficial

- `GET /estoques`: lista estoques e itens atuais.
- `GET /snapshot`: retorna revisão, estoques, reservas, retiradas,
  abastecimentos, devoluções, movimentos e consumos em visão consistente.

## Operações

Todos os POSTs abaixo recebem `commandId`; respostas incluem `revisao` e dados
do registro confirmado. `responsavelId` não é aceito como autoridade.

| Método e path | Request conceitual | Regra principal |
| --- | --- | --- |
| `POST /retiradas` | itens, data, observação | Principal → estoque pessoal, atômico |
| `POST /reservas` | destino, produto, quantidade | protege livre sem alterar físico |
| `POST /reservas/{id}/cancelamento` | commandId | cancela reserva ativa própria |
| `POST /abastecimentos` | local, máquina/produto/quantidade, data | pessoal → local, usa reserva correta |
| `POST /devolucoes` | livre + parcelas por destino, data | pessoal → Principal; libera só o escolhido |
| `POST /consumos-carrinho` | insumos, data, observação | reduz insumo pessoal |
| `POST /movimentos-estoque-principal` | ENTRADA/SAIDA, itens, data | ajuste auditado do Principal |

Itens têm quantidade positiva; requests aceitam no máximo 50 itens e observação
até 500 caracteres. Devolução permite quantidade livre zero quando há parcela
reservada positiva. Regras inválidas retornam erro controlado sem efeito parcial.

## Health

- `GET /health`: saúde agregada;
- `GET /health/liveness`: processo vivo;
- `GET /health/readiness`: aplicação pronta, conexão válida e sem migrations
  pendentes.

Health não expõe URL, usuário, senha ou detalhes internos. Se banco/migration
falha no startup, o container permanece não-ready.

## Erros

Validation, regra, autenticação, acesso, conflito e falha inesperada recebem
status apropriado e corpo Problem Details com `code`, detalhe seguro e
`requestId`. Tokens e stack traces não aparecem no contrato.
