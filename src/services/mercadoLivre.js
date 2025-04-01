// src/services/mercadoLivre.js
const axios = require('axios');

/**
 * Busca produtos na API do Mercado Livre com base na palavra-chave (nicho)
 * @param {string} nicho - Palavra-chave que define o nicho (ex: "maquiagem artística")
 * @returns {Promise<Array>} Array de produtos
 */
async function buscarProdutosPorNicho(nicho) {
  try {
    // Configurar a URL de busca com a palavra-chave e limitar os resultados
    const limit = 100; // Buscar mais resultados para ter variedade
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(nicho)}&limit=${limit}&sort=price_asc`;

    const response = await axios.get(url);
    if (response.data && response.data.results) {
      // Retorna os produtos com os campos essenciais
      return response.data.results.map(produto => ({
        meli_id: produto.id,
        title: produto.title,
        price: produto.price,
        original_price: produto.original_price || null,
        permalink: produto.permalink,
        thumbnail: produto.thumbnail,
        sold_quantity: produto.sold_quantity || 0,
        rating: produto.rating_average || null  // Pode vir de outro endpoint se disponível
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos no Mercado Livre:', error.message);
    return [];
  }
}

module.exports = buscarProdutosPorNicho;
