INSERT INTO usuarios (id, nome) VALUES
    ('RODRIGO', 'Rodrigo'),
    ('CESAR', 'Cesar');

INSERT INTO produtos (id, nome, grupo) VALUES
    ('MIX', 'Mix', 'PELUCIAS'),
    ('PERSONAGENS', 'Personagens', 'PELUCIAS'),
    ('CAPIVARAS', 'Capivaras', 'PELUCIAS'),
    ('BIG', 'Big', 'PELUCIAS'),
    ('STITCH', 'Stitch', 'PELUCIAS'),
    ('POKEMON', 'Pokémon', 'PELUCIAS'),
    ('LABUBU', 'Labubu', 'PELUCIAS'),
    ('MILHO', 'Milho', 'CARRINHO_PIPOCA'),
    ('CHOCOLATE', 'Chocolate', 'CARRINHO_PIPOCA'),
    ('EMBALAGEM_CARRINHO_MEDIA', 'Embalagem Carrinho Média', 'CARRINHO_PIPOCA'),
    ('EMBALAGEM_CARRINHO_GRANDE', 'Embalagem Carrinho Grande', 'CARRINHO_PIPOCA'),
    ('OLEO', 'Óleo', 'CARRINHO_PIPOCA');

INSERT INTO estoques (id, nome, responsavel_id) VALUES
    ('ESTOQUE_PRINCIPAL', 'Estoque Principal', NULL),
    ('ESTOQUE_RODRIGO', 'Estoque Rodrigo', 'RODRIGO'),
    ('ESTOQUE_CESAR', 'Estoque Cesar', 'CESAR');

INSERT INTO estoque_itens (estoque_id, produto_id, quantidade) VALUES
    ('ESTOQUE_PRINCIPAL', 'MIX', 300),
    ('ESTOQUE_PRINCIPAL', 'PERSONAGENS', 200),
    ('ESTOQUE_PRINCIPAL', 'CAPIVARAS', 200),
    ('ESTOQUE_PRINCIPAL', 'BIG', 100),
    ('ESTOQUE_PRINCIPAL', 'STITCH', 100),
    ('ESTOQUE_PRINCIPAL', 'POKEMON', 100),
    ('ESTOQUE_PRINCIPAL', 'LABUBU', 100),
    ('ESTOQUE_PRINCIPAL', 'MILHO', 50),
    ('ESTOQUE_PRINCIPAL', 'CHOCOLATE', 50),
    ('ESTOQUE_PRINCIPAL', 'EMBALAGEM_CARRINHO_MEDIA', 100),
    ('ESTOQUE_PRINCIPAL', 'EMBALAGEM_CARRINHO_GRANDE', 100),
    ('ESTOQUE_PRINCIPAL', 'OLEO', 50);
