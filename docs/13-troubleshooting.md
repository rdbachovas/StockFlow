# Troubleshooting

Use somente comandos de diagnóstico e preserve trabalho existente. Nunca trate
`git reset --hard`, `git clean -fd`, rebase destrutivo ou force push como correção.

## Backend não inicia

```bash
cd backend
mvn test
docker compose ps
docker compose logs backend
```

Confira Java, profile e variáveis obrigatórias. Em `prod`, ausência de DB ou JWT
secret e cookie inseguro fazem o startup falhar de propósito.

## PostgreSQL indisponível, timeout ou readiness DOWN

```bash
docker compose ps
docker compose logs postgres
docker compose exec postgres pg_isready -U stockflow_local -d stockflow
curl --fail http://localhost:8080/api/v1/health/readiness
```

Verifique DNS, porta, allowlist/rede privada, TLS/CA, limite de conexões e
credenciais no gerenciador de secrets. Não imprima a URL completa em tickets.
Readiness em runtime volta a `UP` quando banco/Flyway ficam saudáveis; falha no
startup deixa o endpoint indisponível e o container não-ready.

## Flyway falha

Leia o erro e confira `flyway_schema_history`. Não edite V1–V15 nem execute SQL
corretivo improvisado. Mudança legítima usa V16+ e deve ser testada em cópia.

## JWT secret ausente ou senha inicial

`AUTH_JWT_SECRET` precisa ter ao menos 32 bytes. Em banco novo, as duas variáveis
de senha inicial são necessárias até os hashes existirem. Use secrets fictícios
somente localmente; nunca coloque valores em Markdown, commit ou log.

## CORS ou cookie Web

Confirme que a Origin exata está em `CORS_ALLOWED_ORIGINS`, que o request Web usa
`credentials: include` e que HTTPS combina `SameSite=None` com `Secure`. Não
teste endpoints Native com Origin nem endpoints Web sem Origin permitido.

## Sessão expirada

O cliente tenta um refresh e repete uma vez. Se refresh falhar, faça novo login.
Após troca de senha, novo login é esperado porque as sessões foram revogadas.

## Fila parada ou REQUER_ATENCAO

Abra Sincronização e confira conta, status, tentativas e motivo. Valide conexão e
busque snapshot. `ERRO`/`CONFLITO` permitem reenvio ou descarte consciente.
`REQUER_ATENCAO` normalmente indica comando legado sem criador confiável e não é
reenviado automaticamente. Não altere o payload/AsyncStorage manualmente.

## Dependências npm, Expo ou SecureStore

```bash
cd mobile
npm install
npx tsc --noEmit
npm test -- --runInBand
npx expo export --platform web
```

Confira se está usando a versão Node compatível com o projeto. `expo-secure-store`
é caminho Native; no Web, o refresh fica no cookie HttpOnly.

## Docker e Testcontainers

```bash
docker version
docker info
docker ps
cd backend
mvn test
```

Erro de permissão no socket Docker exige corrigir acesso do usuário/ambiente;
não substitua os testes por H2. O teste de recuperação é:

```bash
cd backend
./scripts/test-backup-restore.sh
```

## Cold start do Render

**PLANEJADO:** Render Free ainda não foi implantado. Quando for, um primeiro
request lento pode ser cold start; medir logs, tempo de readiness e timeout do
cliente antes de alterar configurações.

## Git divergente ou working tree sujo

```bash
git status --short --branch
git diff
git fetch origin
git rev-list --left-right --count origin/main...main
```

Preserve alterações locais, identifique autoria e integre o remoto de forma
segura. Não sobrescreva trabalho, não force push e não inclua arquivos não
relacionados no commit.
