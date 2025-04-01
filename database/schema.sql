-- Tabela de Produtos (dados estáticos do produto)
CREATE TABLE public.produtos (
  id TEXT PRIMARY KEY,         -- Usamos o meli_id como chave primária
  titulo TEXT NOT NULL,
  imagem_url TEXT,
  url TEXT,
  link_afiliado TEXT,
  nicho TEXT,
  marketplace TEXT DEFAULT 'Mercado Livre',
  rating NUMERIC(2,1),
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Histórico de Preço (registros diários)
CREATE TABLE public.historico_preco (
  id SERIAL PRIMARY KEY,
  produto_id TEXT NOT NULL REFERENCES public.produtos(id),
  nicho TEXT NOT NULL,
  data DATE NOT NULL,
  preco_atual NUMERIC(10,2) NOT NULL,
  preco_original NUMERIC(10,2),
  sold_quantity INTEGER,
  desconto_percentual NUMERIC(5,2),
  score NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unq_hist UNIQUE (produto_id, nicho, data)
);
