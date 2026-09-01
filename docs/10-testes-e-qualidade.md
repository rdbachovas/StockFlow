# Testes e qualidade

## Estratégia

- **TypeScript:** `npx tsc --noEmit` verifica contratos do frontend.
- **Jest:** regras locais, persistência, adapters Web/Native, autenticação,
  coordinator, fila, snapshot e fluxos remotos.
- **Maven/JUnit:** services, configurações, hardening e integração HTTP.
- **Testcontainers:** cada suíte de integração relevante usa PostgreSQL real,
  não H2/mock, e aplica Flyway em banco vazio.
- **Concorrência:** mesmo `commandId` em duas threads, locks pessimistas,
  resposta restaurada e revisão única.
- **Rollback:** multi-item inválido não deixa saldo parcial, revisão ou comando.
- **Restore:** script com dois bancos verifica dump, restore, dados, Flyway,
  readiness e restart.
- **Expo export:** garante bundle/rotas Web sem regressão.
- **Git:** `git diff --check` detecta whitespace e conflitos de patch.

As suítes cobrem retirada, reserva, abastecimento, devolução, consumo, Movimento
Principal, snapshot, autenticação, identidade, retenção, idempotência e
infraestrutura. Testes não devem ser removidos/enfraquecidos para obter verde.

## Última validação conhecida

Atualizada em 2026-09-01 após a Fase C:

| Validação | Resultado |
| --- | --- |
| Backend `mvn test` | 160 testes, todos passando |
| PostgreSQL/Testcontainers | PostgreSQL 17.10, passando |
| Mobile Jest | 224 testes em 18 suítes, todos passando |
| TypeScript `--noEmit` | passando |
| Expo Web export | passando; 24 rotas estáticas |
| Backup/restore/restart | passando |
| `git diff --check` | passando |

Essas contagens são um registro histórico, não um baseline fixo. Sempre que uma
fase executar a suíte completa, atualizar data, números e resultados reais.

## Validação recomendada de sistema completo

```bash
cd backend
mvn test
cd ../mobile
npx tsc --noEmit
npm test -- --runInBand
npx expo export --platform web
cd ..
git diff --check
```

Testcontainers requer Docker acessível. O ensaio de recuperação é executado por
`cd backend && ./scripts/test-backup-restore.sh`.
