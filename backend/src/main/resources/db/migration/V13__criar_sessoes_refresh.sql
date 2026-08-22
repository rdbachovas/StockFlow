CREATE TABLE sessoes_refresh (
    id UUID PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL REFERENCES usuarios(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    revogado_em TIMESTAMPTZ,
    substituido_por UUID REFERENCES sessoes_refresh(id)
);

CREATE INDEX idx_sessoes_refresh_usuario
    ON sessoes_refresh (usuario_id);
CREATE INDEX idx_sessoes_refresh_expiracao
    ON sessoes_refresh (expira_em);
