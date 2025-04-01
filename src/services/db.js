// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa a função para criar um cliente Supabase
const { createClient } = require('@supabase/supabase-js');

// Obtém as URLs e chaves de autenticação do Supabase a partir das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Cria uma instância do cliente Supabase para interagir com o banco de dados
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Insere ou atualiza um produto na tabela 'produtos'.
 * Se o produto já existir (com base no ID), ele será atualizado.
 * Caso contrário, será inserido como um novo registro.
 * 
 * @param {Object} produto - Objeto contendo os dados do produto
 * @returns {Promise<Array>} Dados do produto inserido/atualizado ou null em caso de erro
 */
async function upsertProduto(produto) {
  const { data, error } = await supabase
    .from('produtos') // Especifica a tabela 'produtos'
    .upsert({
      id: produto.meli_id,         // Define o ID do produto (usando o meli_id como chave primária)
      titulo: produto.title,       // Título do produto
      imagem_url: produto.thumbnail, // URL da imagem do produto
      url: produto.permalink,      // Link para o produto
      link_afiliado: produto.link_afiliado, // Link de afiliado gerado
      nicho: produto.nicho,        // Nicho ou categoria do produto
      marketplace: produto.marketplace, // Nome do marketplace (ex.: Mercado Livre)
      rating: produto.rating,      // Avaliação do produto
      score: Math.round(produto.score) // Pontuação arredondada
    }, { onConflict: 'id' }); // Define que o conflito será resolvido com base no campo 'id'

  if (error) {
    // Exibe o erro no console e retorna null em caso de falha
    console.error('Erro no upsert do produto:', error.message);
    return null;
  }
  // Retorna os dados do produto inserido ou atualizado
  return data;
}

/**
 * Insere um registro na tabela 'historico_preco'.
 * Este registro armazena informações sobre o preço de um produto em um momento específico.
 * 
 * @param {string} produtoId - ID do produto (meli_id)
 * @param {number} precoOriginal - Preço original do produto
 * @param {number} precoAtual - Preço promocional
 * @param {string} dataColeta - Data da coleta (formato YYYY-MM-DD)
 * @returns {Promise<Array>} Dados inseridos ou null em caso de erro
 */
async function inserirHistoricoPreco(produtoId, precoOriginal, precoAtual, dataColeta) {
  const { data, error } = await supabase
    .from('historico_preco') // Especifica a tabela 'historico_preco'
    .insert([
      {
        produto_id: produtoId, // ID do produto relacionado
        nicho: null,  // Nicho pode ser atualizado posteriormente, se necessário
        data: dataColeta, // Data da coleta do preço
        preco_atual: precoAtual, // Preço promocional
        preco_original: precoOriginal, // Preço original
        sold_quantity: 0,  // Quantidade vendida (ajustável conforme a coleta)
        desconto_percentual: precoOriginal && precoOriginal > precoAtual
          ? (((precoOriginal - precoAtual) / precoOriginal) * 100) // Calcula o desconto percentual
          : 0,
        score: Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100) // Exemplo de cálculo de pontuação
      }
    ]);

  if (error) {
    // Exibe o erro no console e retorna null em caso de falha
    console.error('Erro ao inserir histórico de preço:', error.message);
    return null;
  }
  // Retorna os dados inseridos na tabela
  return data;
}

// Exporta as funções e o cliente Supabase para uso em outros módulos
module.exports = { upsertProduto, inserirHistoricoPreco, supabase };
