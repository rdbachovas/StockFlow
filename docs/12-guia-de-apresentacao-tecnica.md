# Guia de apresentação técnica

## Em 30 segundos

O StockFlow é um sistema de estoque para dois operadores e vários pontos de
abastecimento. Construí o cliente em Expo/React Native e centralizei a autoridade
em Spring Boot com PostgreSQL. O destaque é a consistência: transações atômicas,
reservas sem alterar estoque físico, fila offline sem saldo otimista e
idempotência com `commandId` e advisory locks. A mesma base atende Web e Android
com transporte de refresh token apropriado para cada plataforma.

## Em 1 minuto

Rodrigo e Cesar retiram produtos do estoque principal, reservam por destino,
abastecem máquinas, devolvem itens e consomem insumos. O backend deriva a
identidade do JWT, valida regras dentro de transações PostgreSQL e avança uma
revisão global. Depois de um POST, o cliente só atualiza a tela com um snapshot
oficial de revisão suficiente. Se a rede falha, persiste a intenção com o mesmo
`commandId`; o backend serializa retries concorrentes e restaura a resposta já
processada. Usei Testcontainers/PostgreSQL real e validei migrations, rollback,
backup, restore e restart. O deploy público ainda está planejado.

## Apresentação de 5 minutos

1. **Domínio:** três estoques, dois responsáveis, reservas lógicas e máquinas
   com produtos permitidos.
2. **Arquitetura:** Expo → contexts/services → API Spring → services
   transacionais → PostgreSQL.
3. **Consistência:** locks pessimistas, atomicidade, revisão global e snapshot
   `REPEATABLE_READ`.
4. **Offline:** cache para leitura, fila para intenção, sem alteração otimista.
5. **Idempotência:** mesmo comando, mesmo UUID; advisory lock e resposta salva.
6. **Segurança:** JWT, refresh rotativo, cookie HttpOnly Web/SecureStore Native,
   identidade do token e hardening HTTP.
7. **Produção:** Docker não-root, readiness, Flyway, TLS e restore validado;
   infraestrutura pública ainda planejada.

## Apresentação de 10 minutos

Use o roteiro de 5 minutos e acrescente:

- fórmula de estoque livre e por que reserva não movimenta físico;
- exemplo de POST confirmado com resposta perdida e retry idempotente;
- diferença entre destino lógico `MERCADOS` e os seis locais físicos;
- evolução de AsyncStorage como autoridade para cache/fila;
- rollback de operação multi-item e revisão que não avança;
- bootstrap de senha temporária, rotação/revogação de refresh e auditoria;
- testes com PostgreSQL 17/Testcontainers e recuperação banco A → banco B;
- trade-offs: snapshot completo, revisão global, rate limiter em memória e
  dependência consciente de PostgreSQL.

## Por que usei PostgreSQL?

Preciso de transações, constraints, locks pessimistas, isolamento repetível,
advisory locks e recuperação confiável. O domínio é relacional e auditável; o
banco resolve concorrência que um cache local não resolve.

## Por que criei um backend?

Para ter uma autoridade compartilhada, impedir que o cliente declare a própria
identidade, executar regras atomicamente e oferecer histórico/sessões comuns a
vários dispositivos.

## Como resolvi concorrência?

Locks pessimistas protegem linhas de estoque/reserva/revisão. Um advisory lock
transacional derivado do `commandId` serializa retries da mesma intenção. A
transação inclui efeito, histórico, revisão e resposta idempotente.

## Como funciona offline?

O aplicativo lê o último snapshot e persiste comandos pendentes por usuário.
Não altera saldo local. Na reconexão, envia na ordem, reutiliza IDs ambíguos e
só aplica um snapshot oficial com revisão suficiente.

## Como evito duplicação de operação?

Mesma intenção conserva o UUID. `comandos_processados` guarda usuário, tipo,
revisão e resposta. Se já existe, o backend devolve a resposta sem executar.

## Como funciona autenticação?

BCrypt valida senha; Spring emite access JWT e refresh opaco. Refresh é salvo
como hash, rotacionado e revogável. A identidade percorre Authentication →
IdentidadeAtual → Service → auditoria.

## Qual diferença entre Web e Android?

Ambos mantêm access token em memória. Web recebe refresh em cookie HttpOnly;
Android usa SecureStore. Endpoints e validação de Origin impedem misturar os
dois transportes.

## Como tratei segurança?

Secrets externos, troca obrigatória, rate limiting, CORS/Origin, cookie seguro,
body limitado, headers, logs sanitizados, request ID e erros controlados. O
container roda sem root e readiness depende do banco/Flyway.

## Como preparei produção?

Docker multi-stage, profile prod fail-fast, Hikari pequeno, TLS verificável,
Flyway automático, PostgreSQL 17 real, backup/restore/restart testados. Deploy
Cloudflare/Render/Supabase continua planejado, sem fingir infraestrutura criada.

## Principais trade-offs

- consistência oficial em troca de UI não otimista;
- snapshot simples em troca de volume futuro;
- revisão global simples em troca de serialização;
- PostgreSQL avançado em troca de menor portabilidade para outro SGBD;
- rate limiter local adequado agora, insuficiente para várias réplicas.

## O que eu ainda resolveria?

Deploy/observabilidade reais, teste periódico de restore remoto, paginação e
retenção de históricos, rate limit distribuído se escalar, build Android e,
depois de feedback, redesign. iOS permanece futuro.

## Perguntas de entrevista

**Por que não usar atualização otimista?** Porque uma intenção offline pode ser
rejeitada; exibir saldo especulativo criaria estado impossível e rollback de UI.

**O UUID sozinho impede duplicação?** Não. Ele precisa de armazenamento único e
serialização concorrente; uso PK em `comandos_processados` mais advisory lock.

**O que acontece se o processo cair depois do estoque e antes do comando?** Os
dois estão na mesma transação; sem commit, tudo reverte e o lock é liberado.

**Por que `REPEATABLE_READ` no snapshot?** Para que coleções e revisão pertençam
a uma visão consistente durante a leitura agregada.

**Por que refresh não é JWT persistido em claro?** O refresh é opaco e só seu
hash vai ao banco, permitindo rotação e revogação sem armazenar o segredo.

**Como impede troca de identidade no payload?** O DTO remoto não confia em
`responsavelId`; o service usa o subject autenticado.

**Como testa sem H2?** Testcontainers sobe PostgreSQL 17 e executa Flyway e a API
real, incluindo concorrência e SQL específico.

**O que acontece com fila de Rodrigo ao entrar como Cesar?** Ela permanece
persistida, mas é filtrada por `usuarioIdCriador` e não é enviada por Cesar.
