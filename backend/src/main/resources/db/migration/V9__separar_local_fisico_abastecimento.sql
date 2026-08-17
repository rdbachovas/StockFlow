ALTER TABLE abastecimentos
    DROP CONSTRAINT ck_abastecimentos_local;

ALTER TABLE abastecimentos
    ADD CONSTRAINT ck_abastecimentos_local CHECK (
        local_id IN (
            'BOULEVARD',
            'AEROPORTO',
            'MERCADOS',
            'GAUCHO_VICENTE_FONTOURA',
            'SUPERMAGO_IPIRANGA',
            'GAUCHO_ANTONIO_CARVALHO',
            'SUPERMERCADO_FANTE',
            'SUPERMAGO_PLANALTO',
            'SAMS_CLUB',
            'SUPERMAGO_BOA_VISTA'
        )
    );
