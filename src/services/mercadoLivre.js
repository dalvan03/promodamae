// src/services/mercadoLivre.js
const axios = require('axios');

/**
 * Busca produtos na API do Mercado Livre com base na palavra-chave (nicho)
 * @param {string} nicho - Palavra-chave que define o nicho (ex: "maquiagem artística")
 * @returns {Promise<Array>} Array de produtos
 */
async function buscarProdutosPorNicho(nicho) {
  console.log("buscarProdutosPorNicho started for niche:", nicho);
  try {
    // Configurar a URL de busca com a palavra-chave e limitar os resultados
    const limit = 100; // Define o número máximo de produtos retornados pela API
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(nicho)}&limit=${limit}&sort=price_asc`;

    // Faz a requisição HTTP para a API do Mercado Livre
    const response = await axios.get(url);

    // Verifica se a resposta contém dados e retorna os produtos formatados
    if (response.data && response.data.results) {
      console.log("buscarProdutosPorNicho completed. Total products:", response.data.results.length);
      // Mapeia os produtos retornados para incluir apenas os campos essenciais
      return response.data.results.map(produto => ({
        meli_id: produto.id, // ID único do produto no Mercado Livre
        title: produto.title, // Título do produto
        price: produto.price, // Preço atual do produto
        original_price: produto.original_price || null, // Preço original (se disponível)
        permalink: produto.permalink, // Link para a página do produto
        thumbnail: produto.thumbnail, // URL da imagem do produto
        sold_quantity: produto.sold_quantity || 0, // Quantidade vendida
        rating: produto.rating_average || null // Avaliação média (se disponível)
      }));
    }
    return []; // Retorna um array vazio se não houver produtos
  } catch (error) {
    // Captura e exibe erros no console
    console.error('Erro ao buscar produtos no Mercado Livre:', error.message);
    return [];
  }
}

module.exports = buscarProdutosPorNicho;
