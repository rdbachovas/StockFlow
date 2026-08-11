CREATE TABLE reservas (
    id UUID PRIMARY KEY,
    responsavel_id VARCHAR(50) NOT NULL REFERENCES usuarios(id),
    destino_id VARCHAR(50) NOT NULL,
    produto_id VARCHAR(50) NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    quantidade_utilizada INTEGER NOT NULL DEFAULT 0,
    quantidade_liberada INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_reservas_destino CHECK (
        destino_id IN (
            'BOULEVARD',
            'AEROPORTO',
            'MERCADOS',
            'SUPERMAGO_BOA_VISTA'
        )
    ),
    CONSTRAINT ck_reservas_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_reservas_utilizada CHECK (quantidade_utilizada >= 0),
    CONSTRAINT ck_reservas_liberada CHECK (quantidade_liberada >= 0),
    CONSTRAINT ck_reservas_saldo CHECK (
        quantidade_utilizada + quantidade_liberada <= quantidade
    ),
    CONSTRAINT ck_reservas_status CHECK (
        status IN ('ATIVA', 'CANCELADA', 'CONCLUIDA')
    )
);

CREATE INDEX idx_reservas_ativas_responsavel_produto
    ON reservas (responsavel_id, produto_id)
    WHERE status = 'ATIVA';

CREATE TABLE reserva_eventos (
    id UUID PRIMARY KEY,
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_reserva_eventos_tipo CHECK (
        tipo IN ('CRIACAO', 'CANCELAMENTO')
    ),
    CONSTRAINT ck_reserva_eventos_quantidade CHECK (quantidade >= 0)
);

CREATE INDEX idx_reserva_eventos_reserva_data
    ON reserva_eventos (reserva_id, data);
