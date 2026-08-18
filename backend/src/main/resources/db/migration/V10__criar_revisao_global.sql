CREATE TABLE revisao_estado (
    id INTEGER PRIMARY KEY,
    revisao BIGINT NOT NULL CHECK (revisao >= 0)
);

INSERT INTO revisao_estado (id, revisao) VALUES (1, 0);
