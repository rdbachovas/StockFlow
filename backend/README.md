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

## PostgreSQL de produção

O ambiente validado usa PostgreSQL 17. A produção deve usar PostgreSQL
gerenciado, preferencialmente na mesma região e por rede privada. A conexão é
direta: não usar PgBouncer nesta etapa, pois a idempotência depende de
`pg_advisory_xact_lock` transacional e `hashtextextended`. O schema também usa
`jsonb`, locks pessimistas, transações e isolamento `REPEATABLE_READ`; essas são
dependências explícitas de PostgreSQL.

Configuração obrigatória, sempre como secrets externos ao container:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=verify-full`
- `DB_USERNAME`
- `DB_PASSWORD`
- `AUTH_JWT_SECRET`

Para rede pública, TLS e validação do servidor são obrigatórios. Use
`sslmode=verify-full` e a CA fornecida pelo provedor, instalada como secret no
runtime e referenciada, quando necessária, por
`sslrootcert=/caminho/montado/ca.crt` na `DB_URL`. Alguns provedores usam uma CA
pública já reconhecida pela imagem. Não use `sslmode=disable`, `allow` ou
`require` quando estes não validarem a identidade do servidor, e nunca inclua
CA privada, URL ou credenciais reais no Git. Em rede privada, siga a exigência
TLS do provedor; prefira TLS mesmo assim.

O Hikari usa um pool pequeno e todas as opções podem ser ajustadas no ambiente:

| Variável | Default |
| --- | ---: |
| `DB_POOL_MAX_SIZE` | `5` |
| `DB_POOL_MIN_IDLE` | `1` |
| `DB_POOL_CONNECTION_TIMEOUT_MS` | `10000` |
| `DB_POOL_VALIDATION_TIMEOUT_MS` | `3000` |
| `DB_POOL_IDLE_TIMEOUT_MS` | `600000` |
| `DB_POOL_MAX_LIFETIME_MS` | `1800000` |

Mantenha `maxLifetime` abaixo do limite de conexão do provedor. Não aumente o
pool sem medir demanda e respeitar o limite total de conexões do banco.

### Flyway, bootstrap e restart

O Spring aplica V1–V15 automaticamente antes de validar o modelo JPA. Não rode
migrations manualmente e nunca edite migrations publicadas; mudanças futuras
começam em V16. Em banco vazio, V2 cria Rodrigo e Cesar e o primeiro startup
exige `AUTH_INITIAL_PASSWORD_RODRIGO` e `AUTH_INITIAL_PASSWORD_CESAR`. Elas são
secrets temporários, não são registradas em log e podem ser removidas após o
primeiro startup saudável confirmar os hashes — idealmente depois que ambos
trocarem a senha inicial obrigatória.

Reiniciar o backend com o banco preservado apenas valida as migrations já
aplicadas: usuários, revisão, comandos idempotentes, sessões e dados permanecem.
`/api/v1/health/readiness` responde `DOWN` antes da inicialização completa, com
banco indisponível em runtime ou migrations pendentes, sem expor detalhes; volta
a `UP` quando conexão, Flyway e aplicação estão saudáveis. Se conexão ou
migration falhar durante o startup, o Spring falha fechado e o endpoint fica
indisponível (container não-ready) até a infraestrutura ser corrigida.

### Backup e restore

Requisitos mínimos do serviço gerenciado:

- backup automático diário com retenção mínima de 7 dias;
- point-in-time recovery, se couber no plano;
- restore testado em banco separado após a criação e periodicamente;
- dump lógico periódico antes de migrations relevantes e conforme o risco.

Exemplos sem credenciais embutidas (use uma URL PostgreSQL fornecida como secret
no shell e TLS validado):

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges \
  --file=/caminho-seguro/stockflow.dump
createdb "$RESTORE_DATABASE_URL"
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists \
  --no-owner --no-privileges /caminho-seguro/stockflow.dump
```

O teste local reproduz Banco A → dado marcador → dump → Banco B → restore →
startup/Flyway → readiness → conferência do dado. Ele usa nomes isolados,
arquivo temporário fora do repositório e remove os recursos ao terminar:

```bash
cd backend
./scripts/test-backup-restore.sh
```

Para repetir o smoke test no banco remoto, restaure primeiro em uma instância
descartável, aponte uma única instância do backend para ela e confirme: 15
migrations com sucesso, readiness `UP`, snapshot e dados esperados. Execute
também `mvn test`: o teste PostgreSQL real envia duas operações concorrentes com
o mesmo `commandId`, comprova um único movimento/revisão/resultado e confirma
que rollback libera o advisory lock para uma nova tentativa.

### Operação e capacidade

O job diário remove sessões refresh e comandos idempotentes conforme
`AUTH_REFRESH_RETENTION_DAYS` e `IDEMPOTENCY_RETENTION_DAYS`; os testes exercitam
as consultas no PostgreSQL real. Históricos, movimentos, abastecimentos,
retiradas, consumos e eventos de reserva ainda crescem sem retenção. Monitorar
tamanho, índices e duração dos backups; paginação e snapshots incrementais não
fazem parte desta fase.

Troubleshooting básico:

- timeout de conexão: conferir região/rede privada, allowlist, DNS, porta e
  limites do pool;
- erro TLS: conferir hostname da URL, CA montada e requisitos do provedor, sem
  reduzir `sslmode`;
- startup interrompido: consultar erro do Flyway e conectividade; não executar
  SQL corretivo manual nem alterar V1–V15;
- readiness `DOWN`: conferir saúde do PostgreSQL, credenciais e migrations nos
  logs sanitizados do backend.

Antes de contratar o banco, registrar região, host/URL JDBC, database, username,
password, requisitos/CA de SSL, disponibilidade de rede privada, política de
backup/retenção e procedimento de restore. O repositório permanece portátil e
não cria nem contrata infraestrutura automaticamente.
