ALTER TABLE usuarios
    ADD COLUMN senha_alterada_em TIMESTAMPTZ,
    ADD COLUMN troca_senha_obrigatoria BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE usuarios
SET troca_senha_obrigatoria = TRUE
WHERE senha_hash IS NOT NULL;

CREATE INDEX idx_sessoes_refresh_revogacao
    ON sessoes_refresh (revogado_em);

CREATE INDEX idx_comandos_processados_data
    ON comandos_processados (data_processamento);
