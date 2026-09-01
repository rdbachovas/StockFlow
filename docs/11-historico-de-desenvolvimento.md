# Histórico de desenvolvimento

Esta linha do tempo registra evolução de engenharia, não apenas commits.

## Fundação mobile — IMPLEMENTADO

**Problema:** organizar estoque e operações do domínio. **Decisão:** Expo/React
Native, modelos em português, Services puros e AppContext. **Implementação:**
estoques, produtos, reservas, máquinas, abastecimento, devolução e históricos.
**Resultado:** regras executáveis e UI operacional. **Trade-off:** autoridade em
um dispositivo, sem coordenação multiusuário.

## Persistência local e redesign — IMPLEMENTADO; visual congelado

**Problema:** perder estado ao reiniciar e tornar fluxos utilizáveis. **Decisão:**
envelope versionado no AsyncStorage e componentes visuais reutilizáveis.
**Resultado:** cache validado, datas restauradas e navegação atual. **Trade-off:**
cache local ainda não resolvia concorrência. O redesign criado está congelado;
novo redesign é **FUTURO**, após feedback.

## Backend e operações remotas — IMPLEMENTADO

**Problema:** compartilhar estado entre Rodrigo/Cesar. **Decisão:** Spring Boot,
JPA, PostgreSQL e migrations Flyway; backend como autoridade. **Implementação:**
retirada, reserva, abastecimento, devolução, Movimento Principal e consumo via
API. **Resultado:** transações e auditoria central. **Trade-off:** dependência de
rede e infraestrutura.

## Snapshot, Coordinator e revisão global — IMPLEMENTADO

**Problema:** POST confirmado e UI/cache incoerentes. **Decisão:** resposta com
revisão seguida de snapshot oficial; Coordinator serializa operações.
**Resultado:** cliente nunca aplica snapshot mais antigo. **Trade-off:** snapshot
completo pode crescer e uma revisão global serializa avanços.

## Idempotência, fila offline e reconciliação — IMPLEMENTADO

**Problema:** retry de POST ambíguo podia duplicar estoque. **Decisão:** UUID por
intenção, comandos persistidos e advisory locks no PostgreSQL; sem saldo
otimista. **Resultado:** retry seguro e fila segregada por criador. **Trade-off:**
usuário vê último saldo confirmado até reconciliação; dependência PostgreSQL.

## Autenticação backend/mobile e identidade JWT — IMPLEMENTADO

**Problema:** `responsavelId` enviado pelo cliente não era autoridade segura.
**Decisão:** Spring Security, BCrypt, JWT/refresh e identidade derivada do token;
cookie HttpOnly Web e SecureStore Native. **Resultado:** autorização e auditoria
por conta. **Trade-off:** ciclo de sessão/rotação mais complexo.

## Fases A1–A4 — IMPLEMENTADO

**Problema:** levar autenticação de funcional a operacionalmente segura.
**Decisões/implementação:** separação Web/Native, validação de Origin/CORS,
cookie seguro, troca obrigatória de senha, rate limiting, retenção, limites de
request, headers, correlation ID, health/readiness e configuração fail-fast.
**Resultado:** borda endurecida e segredos externalizados. **Trade-off:** rate
limiter local pressupõe uma réplica.

## Fase B: Docker — IMPLEMENTADO

**Problema:** runtime reproduzível e preparado para hosting. **Decisão:** imagem
multi-stage Java 21, usuário não-root, compose e healthcheck. **Resultado:**
container local validado com PostgreSQL persistente e restart. **Trade-off:**
imagem/build e operação Docker aumentam ferramentas necessárias.

## Fase C: PostgreSQL, backup e restore — IMPLEMENTADO

**Problema:** provar portabilidade e recuperação antes do banco remoto.
**Decisão:** conexão direta, TLS verificável, pool 5/1, testes PostgreSQL 17 e
script simples de dump/restore. **Resultado:** V1–V15 em banco vazio,
concorrência/rollback, retenção, restore e restart validados. **Trade-off:** banco
remoto ainda precisa ser criado manualmente; históricos continuam crescendo.

## Próximas etapas

- stack Free (Cloudflare Pages/Render/Supabase PostgreSQL): **PLANEJADO**;
- criação do banco e deploy público: **PLANEJADO**;
- publicação Web: **PLANEJADO**;
- build/distribuição Android: **PLANEJADO**;
- redesign após feedback: **FUTURO**;
- configuração e distribuição iOS: **FUTURO**.
