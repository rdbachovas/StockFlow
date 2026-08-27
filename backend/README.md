# Backend StockFlow

## Container local

A imagem usa Maven/JDK 21 apenas no estágio de build e Eclipse Temurin JRE 21
Alpine no runtime. O processo roda sem privilégios com UID/GID `10001`. O valor
default de `JAVA_TOOL_OPTIONS` limita o heap a 75% da memória disponível e pode
ser substituído no ambiente conforme o limite do provedor.

Build e execução direta, usando somente `backend/` como contexto:

```bash
cd backend
docker build --tag stockflow-backend:local .
docker run --rm --name stockflow-backend --publish 8080:8080 \
  --env SPRING_PROFILES_ACTIVE=prod \
  --env DB_URL=jdbc:postgresql://host.docker.internal:5432/stockflow \
  --env DB_USERNAME=stockflow \
  --env DB_PASSWORD=valor-local \
  --env AUTH_JWT_SECRET=segredo-local-com-pelo-menos-32-bytes \
  --env AUTH_INITIAL_PASSWORD_RODRIGO='RodrigoLocal123!' \
  --env AUTH_INITIAL_PASSWORD_CESAR='CesarLocal123!' \
  --env CORS_ALLOWED_ORIGINS=http://localhost:19006 \
  stockflow-backend:local
```

`SPRING_PROFILES_ACTIVE`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`AUTH_JWT_SECRET` e `CORS_ALLOWED_ORIGINS` devem ser fornecidas externamente em
produção. `PORT` é opcional e tem default `8080`. Configurações existentes de
cookie, pool, rate limiting, retenção e limites HTTP continuam disponíveis por
variáveis de ambiente; nenhum segredo é embutido na imagem. Em um banco novo,
`AUTH_INITIAL_PASSWORD_RODRIGO` e `AUTH_INITIAL_PASSWORD_CESAR` também são
necessárias no primeiro startup e devem ser fornecidas pelo ambiente.

O ambiente local completo usa credenciais exclusivamente locais/de teste:

```bash
docker compose up --build --detach
docker compose logs --follow backend
docker compose restart backend
docker compose down
docker compose down --volumes --remove-orphans
```

O último comando remove também o banco local persistido. O backend aguarda o
healthcheck do PostgreSQL, inicia o Spring Boot e deixa o próprio Flyway aplicar
as migrations. Não existe script de migrations separado.

Health checks:

```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/health/readiness
curl http://localhost:8080/api/v1/health/liveness
```

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

## Hardening HTTP

Toda resposta da API usa `Cache-Control: no-store`, recebe um
`X-Request-Id` seguro e inclui headers contra MIME sniffing, framing e vazamento
de referrer. Em HTTPS, HSTS é enviado com validade de um ano. Requests possuem
limite padrão de 1 MiB, configurável por `HTTP_MAX_BODY_BYTES`; operações aceitam
até 50 itens. O log de acesso omite health checks, headers e bodies e registra
somente request ID, método, path, status e duração.

O backend não serve os assets do Expo Web. A CSP deve ser definida no hosting
estático depois que os domínios reais de scripts, fontes, imagens e conexões
forem conhecidos. Não foi adicionada uma CSP genérica à API para evitar uma
política ineficaz ou incompatível com o bundle Web.
