// src/services/db.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Insere ou atualiza um produto na tabela 'produtos'.
 * @param {Object} produto - Objeto contendo os dados do produto
 * @returns {Promise<Array>} Dados do produto inserido/atualizado
 */
async function upsertProduto(produto) {
  const { data, error } = await supabase
    .from('produtos')
    .upsert({
      id: produto.meli_id,         // Usamos o meli_id como PK
      titulo: produto.title,
      imagem_url: produto.thumbnail,
      url: produto.permalink,
      link_afiliado: produto.link_afiliado,
      nicho: produto.nicho,
      marketplace: produto.marketplace,
      rating: produto.rating,
      score: Math.round(produto.score)
    }, { onConflict: 'id' });

  if (error) {
    console.error('Erro no upsert do produto:', error.message);
    return null;
  }
  return data;
}

/**
 * Insere um registro na tabela 'historico_preco'
 * @param {string} produtoId - ID do produto (meli_id)
 * @param {number} precoOriginal - Preço original do produto
 * @param {number} precoAtual - Preço promocional
 * @param {string} dataColeta - Data da coleta (YYYY-MM-DD)
 * @returns {Promise<Array>} Dados inseridos
 */
async function inserirHistoricoPreco(produtoId, precoOriginal, precoAtual, dataColeta) {
  const { data, error } = await supabase
    .from('historico_preco')
    .insert([
      {
        produto_id: produtoId,
        nicho: null,  // Este campo pode ser atualizado se desejar (ou já estar no objeto do produto)
        data: dataColeta,
        preco_atual: precoAtual,
        preco_original: precoOriginal,
        sold_quantity: 0,  // Pode ser atualizado se desejado; aqui, ajuste conforme a coleta
        desconto_percentual: precoOriginal && precoOriginal > precoAtual
          ? (((precoOriginal - precoAtual) / precoOriginal) * 100)
          : 0,
        score: Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100) // exemplo
      }
    ]);

  if (error) {
    console.error('Erro ao inserir histórico de preço:', error.message);
    return null;
  }
  return data;
}

module.exports = { upsertProduto, inserirHistoricoPreco, supabase };
