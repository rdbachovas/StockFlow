CREATE TABLE comandos_processados (
    command_id UUID PRIMARY KEY,
    tipo_operacao VARCHAR(50) NOT NULL,
    revisao BIGINT NOT NULL,
    resposta_json TEXT NOT NULL,
    data_processamento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
