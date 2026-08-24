# Backend StockFlow

## Transporte da sessão

O access token permanece no corpo da resposta e é usado como Bearer token em
todas as plataformas. O transporte do refresh token é separado na borda HTTP:

- Native usa `/api/v1/auth/login`, `/refresh` e `/logout`, sem header `Origin`.
  O refresh token continua no JSON para armazenamento no SecureStore.
- Web usa `/api/v1/auth/web/login`, `/refresh` e `/logout`, sempre com uma
  `Origin` presente em `CORS_ALLOWED_ORIGINS`. O refresh token existe somente no
  cookie HttpOnly e nunca faz parte do JSON Web.

Os endpoints Native rejeitam requests de navegador com `Origin`. Os endpoints
Web exigem uma origin explicitamente autorizada, além da política CORS. O cookie
é usado somente no ciclo de autenticação; os demais endpoints continuam
exigindo `Authorization: Bearer`.

## Cookie Web

Variáveis disponíveis:

- `AUTH_COOKIE_NAME` (default `stockflow_refresh`)
- `AUTH_COOKIE_PATH` (default `/api/v1/auth/web`)
- `AUTH_COOKIE_SECURE` (default `false` em dev e obrigatório `true` em prod)
- `AUTH_COOKIE_SAME_SITE` (default `Lax` em dev e `None` em prod)

O atributo HttpOnly é sempre habilitado e não pode ser desligado por variável.
O `Max-Age` acompanha `AUTH_REFRESH_TOKEN_SECONDS`. Nenhum domínio é definido,
portanto o cookie fica host-only. Em produção, `SameSite=None` exige `Secure`.
