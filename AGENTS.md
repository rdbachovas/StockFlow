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

Screens → AuthContext/AppContext → Services/Coordinator → API Spring Boot
→ Services de domínio → JPA/transações → PostgreSQL

Services de domínio contêm regras e validações e não recebem AsyncStorage, HTTP
ou UI. Integrações ficam nos services dedicados de API, persistência,
sincronização e adapters de plataforma.

AppContext é a fonte reativa no cliente. PostgreSQL, acessado pelo backend, é a
fonte oficial; AsyncStorage mantém cache e fila offline.

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

Antes de concluir alterações, execute as validações relevantes. Quando a tarefa
afetar o sistema completo, execute:

```bash
cd backend
mvn test
cd ../mobile
npx tsc --noEmit
npm test -- --runInBand
npx expo export --platform web
```

Não remover ou enfraquecer testes para fazer código passar.

## Documentação viva

DOCUMENTATION IS PART OF THE IMPLEMENTATION.

A documentação oficial está em `docs/` e deve refletir sempre o código real.
Uma tarefa não está concluída se o código mudou e a documentação afetada ficou
desatualizada. Diferencie explicitamente `IMPLEMENTADO`, `PLANEJADO`, `FUTURO`
e `DEPRECIADO`; nunca descreva planejamento como funcionalidade disponível.

Em toda tarefa:

1. implementar;
2. testar;
3. identificar a documentação afetada;
4. atualizar apenas os arquivos `docs/*.md` correspondentes;
5. atualizar `docs/11-historico-de-desenvolvimento.md` quando houver nova fase
   ou decisão arquitetural relevante;
6. atualizar a seção “Última validação conhecida” de
   `docs/10-testes-e-qualidade.md` quando a suíte completa for executada;
7. revisar código e documentação em conjunto;
8. executar `git diff --check`;
9. commit;
10. push.

Exemplos de roteamento:

- autenticação: `04-autenticacao-e-seguranca.md` e, conforme o impacto,
  `07-backend-api.md`/`08-frontend-mobile-web.md`;
- banco: `06-banco-de-dados.md` e `09-infraestrutura-e-deploy.md`;
- visual: `01-manual-do-usuario.md` e `08-frontend-mobile-web.md`.

Nunca registrar senhas, tokens, connection strings reais, cookies, certificados
privados ou dados privados na documentação.

## Frontend visual congelado

O frontend visual/UX está congelado. Até autorização explícita, não redesenhar,
alterar estética, reorganizar navegação nem mudar a identidade visual. Somente
alterações técnicas necessárias são permitidas. Um redesign futuro ocorrerá
após feedback dos chefes/usuários.

## Git

Para toda implementação solicitada que estiver concluída e completamente validada,
seguir automaticamente o fluxo:

IMPLEMENTAR → VALIDAR → REVISAR DIFF → COMMIT AUTOMÁTICO → PUSH AUTOMÁTICO

Esta política substitui qualquer instrução anterior de não fazer commit ou push sem
autorização explícita.

### Antes de começar

- Executar `git status`.
- Identificar alterações pré-existentes.
- Não sobrescrever nem incluir mudanças não relacionadas à tarefa.

### Depois de implementar

- Executar todos os testes e validações relevantes.
- Executar `git diff --check`.
- Revisar `git status` e `git diff`.
- Confirmar que somente arquivos relacionados à tarefa serão incluídos.

### Se tudo passar

- Executar `git add` somente nos arquivos relacionados; não usar `git add .`
  indiscriminadamente quando houver outros arquivos modificados.
- Criar automaticamente um commit com mensagem curta e descritiva, usando um dos
  prefixos: `feat:`, `fix:`, `refactor:`, `chore:` ou `test:`.
- Fazer push automaticamente para o branch remoto atual.
- Se o branch não tiver upstream, executar `git push -u origin <branch-atual>`.
- Se o branch já tiver upstream, executar `git push` normalmente.
- Se não houver mudança real, não criar commit vazio nem fazer push desnecessário.

### Se alguma validação falhar

- Não fazer commit nem push.
- Corrigir a falha e validar novamente.
- Fazer commit e push somente quando tudo estiver verde.

### Alterações não relacionadas

- Nunca incluir mudanças antigas ou não relacionadas.
- Preservar essas mudanças fora do commit.
- Não sobrescrever trabalho existente.

### Operações proibidas

- `git reset --hard`.
- `git clean -fd`.
- Force push, incluindo `git push --force`.
- Rebase destrutivo.
- Apagar stash.
- Sobrescrever trabalho existente local ou remoto.

### Conflito de push

Se o remoto tiver avançado:

- Não forçar o push.
- Executar `git fetch`.
- Analisar a divergência e integrar de forma segura.
- Reexecutar as validações necessárias.
- Fazer push somente depois que tudo estiver validado.

Nunca sobrescrever diretamente trabalho remoto.

### Relatório final de cada tarefa

Informar:

- Testes e validações executados.
- Resultado das validações.
- Principais arquivos alterados.
- Hash e mensagem do commit.
- Branch.
- Resultado do push.
- `git status` final.
- Alterações não relacionadas que ficaram fora do commit.
