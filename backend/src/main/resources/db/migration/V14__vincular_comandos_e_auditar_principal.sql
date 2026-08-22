ALTER TABLE comandos_processados
    ADD COLUMN usuario_id VARCHAR(50) REFERENCES usuarios(id);

ALTER TABLE movimentos_estoque_principal
    ADD COLUMN usuario_id VARCHAR(50) REFERENCES usuarios(id);

UPDATE comandos_processados
SET usuario_id = resposta_json::jsonb ->> 'responsavelId'
WHERE resposta_json::jsonb ? 'responsavelId'
  AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = resposta_json::jsonb ->> 'responsavelId'
  );

CREATE INDEX idx_comandos_processados_usuario
    ON comandos_processados (usuario_id);
CREATE INDEX idx_movimentos_principal_usuario
    ON movimentos_estoque_principal (usuario_id);
