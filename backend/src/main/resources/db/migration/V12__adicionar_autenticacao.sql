ALTER TABLE usuarios
    ADD COLUMN login VARCHAR(100),
    ADD COLUMN senha_hash VARCHAR(100),
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE usuarios SET login = LOWER(id);

ALTER TABLE usuarios ALTER COLUMN login SET NOT NULL;

CREATE UNIQUE INDEX uq_usuarios_login_normalizado
    ON usuarios (LOWER(login));

ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_login_minusculo
    CHECK (login = LOWER(login));
