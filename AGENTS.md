# StockFlow Guidelines

## Projeto

App Expo/React Native em `mobile/`.

Estrutura:
- `src/app` rotas
- `src/screens` telas
- `src/context` estado global
- `src/services` regras de negócio
- `src/models` tipos
- `src/data` seed
- `src/utils` helpers
- `__tests__` testes Jest

Use TypeScript, 4 espaços, aspas duplas e nomes do domínio em português.

## Arquitetura

Fluxo atual:

Screens → AppContext → Services

Services contêm regras e validações.
Não colocar AsyncStorage, HTTP ou UI dentro dos Services.

AppContext é a fonte reativa de estado.

## Estoques

Existem:
- Estoque Principal
- Estoque Rodrigo
- Estoque Cesar

Rodrigo e Cesar podem retirar produtos do Principal para seus estoques pessoais.

Nunca permitir estoque negativo.

Operações com vários itens devem ser atômicas:
se um item for inválido, nenhum item deve ser alterado.

## Produtos

Pelúcias:
- MIX
- PERSONAGENS
- CAPIVARAS
- BIG
- STITCH
- POKEMON
- LABUBU

Carrinho:
- MILHO
- CHOCOLATE
- EMBALAGEM_CARRINHO_MEDIA
- EMBALAGEM_CARRINHO_GRANDE
- OLEO

Insumos do carrinho podem existir no Principal, Rodrigo ou Cesar.

Insumos NÃO participam de reservas ou abastecimento de máquinas.

Consumo do carrinho reduz o estoque pessoal do responsável.

## Reservas

Reserva não altera estoque físico.

Livre = físico - reservas ativas restantes.

Destinos:
- BOULEVARD
- AEROPORTO
- MERCADOS
- SUPERMAGO_BOA_VISTA

Rodrigo:
- BOULEVARD
- MERCADOS
- SUPERMAGO_BOA_VISTA

Cesar:
- AEROPORTO
- MERCADOS
- SUPERMAGO_BOA_VISTA

MERCADOS aceita apenas:
- MIX
- CAPIVARAS

BOA_VISTA aceita apenas:
- BIG

Os 6 mercados normais compartilham UMA reserva MERCADOS.

Reservas de outros destinos devem permanecer protegidas.

## Locais

Boulevard:
M1-M3 → MIX/PERSONAGENS
M4 → CAPIVARAS
M5 → BIG

Aeroporto:
B01 → STITCH
B02 → CAPIVARAS
B03 → PERSONAGENS
GRANDE_DIREITA/ESQUERDA → BIG
B06 → MIX
B07 → LABUBU

Abastecimento de Boulevard/Aeroporto deve gerar um registro agregado, não um por máquina.

## Devolução

Pessoal → Principal pode usar:
- estoque livre
- quantidade explicitamente escolhida de uma reserva

Nunca cancelar reservas arbitrariamente.

## Testes

Baseline atual: 54 testes passando.

Antes de concluir alterações:

cd mobile
npx tsc --noEmit
npm test

Não remover ou enfraquecer testes para fazer código passar.

## Persistência

Próxima tarefa: persistência local com AsyncStorage.

Arquitetura desejada:

AppContext
├── Services
└── PersistenceService → AsyncStorage

Requisitos:
- estado completo persistido
- versionamento do formato
- restaurar Date corretamente
- carregar estado antes de mostrar o app
- seed apenas quando não houver estado salvo
- tratar dados inválidos
- adicionar testes de persistência
- manter os 54 testes atuais passando

Não implementar backend, Spring Boot ou PostgreSQL ainda.

## Git

Não fazer commit ou push sem pedido explícito.
Não sobrescrever alterações não relacionadas.
