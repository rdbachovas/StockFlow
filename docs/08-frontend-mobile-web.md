# Frontend Mobile e Web

## Stack e organização

**IMPLEMENTADO:** Expo, React Native, TypeScript e Expo Router. Rotas ficam em
`src/app`, telas em `src/screens`, componentes reutilizáveis em `src/components`,
estado em `AuthContext`/`AppContext`, regras/helpers em `src/services`, DTOs e
modelos em pastas próprias.

O design system usa `constants/theme`, componentes de UI (`Button`, `Card`,
`Chip`, `FeedbackBanner`, `EmptyState`) e componentes de domínio/histórico. As
abas atuais são Início, Estoques, Operações e Histórico.

## Estado e dados

- `AuthContext`: carregando, não autenticado, troca obrigatória e autenticado;
- `AppContext`: snapshot, operações, fila e estado de sincronização;
- `ApiService`: URL/timeout externos, Bearer e refresh automático após 401;
- `OperacaoRemotaCoordinator`: POST, revisão, snapshot e serialização;
- `PersistenceService`: envelope versionado do snapshot em AsyncStorage e
  restauração segura de datas;
- `FilaComandosPersistenceService`: fila offline separada e validada;
- `SnapshotMapper`: contrato backend → modelos da aplicação.

## Diferenças por plataforma

### Web — IMPLEMENTADO

Refresh usa endpoints Web e cookie HttpOnly com `credentials: include`; access
token permanece em memória. O export estático do Expo funciona. O hosting
público ainda é **PLANEJADO**.

### Android — IMPLEMENTADO no código

Refresh token fica no `expo-secure-store`, access token em memória e endpoints
Native não usam cookie. Geração/distribuição de APK não faz parte do estado atual
documentado e é **PLANEJADA**.

### iOS — FUTURO

O código React Native/adapters oferece base multiplataforma, mas configuração,
build, testes e distribuição iOS ainda não foram executados.

## Frontend visual congelado

O frontend visual/UX está **CONGELADO**. Até autorização explícita não se deve
redesenhar, alterar estética/identidade visual nem reorganizar a navegação.
Somente manutenção técnica necessária é permitida. Um redesign futuro será
feito após feedback dos chefes/usuários.
