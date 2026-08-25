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

## Segurança operacional

O rate limiter é local à JVM e atua somente em login e refresh. Login conta
falhas por IP e por login normalizado; refresh conta requests por IP. O endereço
é obtido de `HttpServletRequest.getRemoteAddr()`, já ajustado pela estratégia de
forwarded headers do Spring. Isso pressupõe que o provedor remova headers
encaminhados não confiáveis. Com mais de uma réplica será necessário substituir
o estado em memória por um armazenamento compartilhado, como Redis.

Configurações:

- `AUTH_LOGIN_RATE_LIMIT_ATTEMPTS` (default 5)
- `AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS` (default 300)
- `AUTH_REFRESH_RATE_LIMIT_ATTEMPTS` (default 30)
- `AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS` (default 60)
- `AUTH_RATE_LIMIT_CLEANUP_MS` (default 600000)
- `AUTH_PASSWORD_MIN_LENGTH` (default 12)
- `AUTH_PASSWORD_MAX_LENGTH` (default 128)
- `AUTH_INITIAL_PASSWORD_TEMPORARY` (default true)
- `AUTH_REFRESH_RETENTION_DAYS` (default 30)
- `IDEMPOTENCY_RETENTION_DAYS` (default 90)
- `SECURITY_CLEANUP_CRON` (default diário, às 03:30)

Senhas criadas pelo bootstrap são temporárias por padrão. Enquanto a troca for
obrigatória, o backend permite somente autenticação, refresh, logout, `/auth/me`
e `/auth/change-password`; endpoints operacionais retornam 403. A troca revoga
todas as sessões refresh do usuário e exige novo login. Access tokens já
emitidos permanecem criptograficamente válidos até a expiração, mas a flag de
troca obrigatória é consultada no banco antes de operações enquanto estiver
ativa. Não há blacklist de access tokens nesta fase.

O cleanup remove apenas refresh sessions expiradas ou revogadas há mais de 30
dias. Comandos idempotentes usam retenção conservadora de 90 dias, muito acima
da janela normal de retry da fila offline. Ambos os prazos são configuráveis e
o job é transacional, idempotente e executado por uma única tarefa local.
