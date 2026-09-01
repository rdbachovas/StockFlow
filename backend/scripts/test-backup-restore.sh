#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
backend_dir="$(cd "${script_dir}/.." && pwd)"
run_id="${RANDOM}-$$"
network="stockflow-restore-${run_id}"
database_a="stockflow-db-a-${run_id}"
database_b="stockflow-db-b-${run_id}"
backend_a="stockflow-api-a-${run_id}"
backend_b="stockflow-api-b-${run_id}"
dump_file="$(mktemp /tmp/stockflow-restore-XXXXXX.dump)"
database_password="restore-test-only"
jwt_secret="restore-test-jwt-secret-with-at-least-32-bytes"

cleanup() {
    docker rm --force "${backend_a}" "${backend_b}" \
        "${database_a}" "${database_b}" >/dev/null 2>&1 || true
    docker network rm "${network}" >/dev/null 2>&1 || true
    rm -f "${dump_file}"
}
trap cleanup EXIT

wait_postgres() {
    local container="$1"
    for _ in $(seq 1 30); do
        if docker exec "${container}" pg_isready \
                --username stockflow --dbname stockflow >/dev/null 2>&1; then
            return
        fi
        sleep 1
    done
    return 1
}

wait_backend() {
    local container="$1"
    for _ in $(seq 1 60); do
        if docker exec "${container}" wget --quiet --spider \
                http://127.0.0.1:8080/api/v1/health/readiness; then
            return
        fi
        sleep 1
    done
    docker logs "${container}"
    return 1
}

start_backend() {
    local name="$1"
    local database="$2"
    docker run --detach --name "${name}" --network "${network}" \
        --env SPRING_PROFILES_ACTIVE=prod \
        --env "DB_URL=jdbc:postgresql://${database}:5432/stockflow" \
        --env DB_USERNAME=stockflow \
        --env "DB_PASSWORD=${database_password}" \
        --env "AUTH_JWT_SECRET=${jwt_secret}" \
        --env AUTH_INITIAL_PASSWORD_RODRIGO=restore-test-rodrigo \
        --env AUTH_INITIAL_PASSWORD_CESAR=restore-test-cesar \
        --env AUTH_INITIAL_PASSWORD_TEMPORARY=false \
        stockflow-backend:local >/dev/null
}

cd "${backend_dir}"
docker build --tag stockflow-backend:local .
docker network create "${network}" >/dev/null

for database in "${database_a}" "${database_b}"; do
    docker run --detach --name "${database}" --network "${network}" \
        --env POSTGRES_DB=stockflow \
        --env POSTGRES_USER=stockflow \
        --env "POSTGRES_PASSWORD=${database_password}" \
        postgres:17-alpine >/dev/null
    wait_postgres "${database}"
done

start_backend "${backend_a}" "${database_a}"
wait_backend "${backend_a}"
docker exec "${database_a}" psql --username stockflow --dbname stockflow \
    --command "UPDATE estoque_itens SET quantidade = 321 WHERE estoque_id = 'ESTOQUE_PRINCIPAL' AND produto_id = 'MIX'; UPDATE revisao_estado SET revisao = 7 WHERE id = 1; INSERT INTO comandos_processados (command_id, tipo_operacao, revisao, resposta_json, usuario_id) VALUES ('11111111-1111-1111-1111-111111111111', 'TESTE_RESTORE', 7, '{}', 'RODRIGO'); INSERT INTO sessoes_refresh (id, usuario_id, token_hash, criado_em, expira_em) VALUES ('22222222-2222-2222-2222-222222222222', 'RODRIGO', repeat('a', 64), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1 day')" >/dev/null
docker exec "${database_a}" pg_dump --username stockflow --dbname stockflow \
    --format custom --file=/tmp/stockflow.dump
docker cp "${database_a}:/tmp/stockflow.dump" "${dump_file}"

docker stop "${backend_a}" >/dev/null
docker cp "${dump_file}" "${database_b}:/tmp/stockflow.dump"
docker exec "${database_b}" pg_restore --username stockflow --dbname stockflow \
    --clean --if-exists --no-owner --no-privileges /tmp/stockflow.dump
start_backend "${backend_b}" "${database_b}"
wait_backend "${backend_b}"

test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT quantidade FROM estoque_itens WHERE estoque_id = 'ESTOQUE_PRINCIPAL' AND produto_id = 'MIX'")" = "321"
test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE")" = "15"
test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT revisao FROM revisao_estado WHERE id = 1")" = "7"
test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT COUNT(*) FROM comandos_processados")" = "1"
test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT COUNT(*) FROM sessoes_refresh")" = "1"

docker restart "${backend_b}" >/dev/null
wait_backend "${backend_b}"
test "$(docker exec "${database_b}" psql --tuples-only --no-align \
    --username stockflow --dbname stockflow \
    --command "SELECT quantidade || ':' || (SELECT revisao FROM revisao_estado WHERE id = 1) || ':' || (SELECT COUNT(*) FROM comandos_processados) || ':' || (SELECT COUNT(*) FROM sessoes_refresh) FROM estoque_itens WHERE estoque_id = 'ESTOQUE_PRINCIPAL' AND produto_id = 'MIX'")" = "321:7:1:1"

echo "Restore e restart validados: dados preservados, Flyway V1-V15 válido e readiness UP."
