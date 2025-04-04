// src/services/mercadoLivre.js
const axios = require('axios');
require('dotenv').config();

let accessToken = process.env.MELI_ACCESS_TOKEN;
let refreshToken = process.env.MELI_REFRESH_TOKEN;

/**
 * Atualiza o access token usando o refresh token.
 */
async function atualizarAccessToken() {
  console.log("Atualizando access token...");
  const url = 'https://api.mercadolibre.com/oauth/token';
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;

  try {
    const response = await axios.post(url, null, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      params: {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      },
    });

    // Atualiza os tokens
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    console.log("Novo access token obtido:", accessToken);
    console.log("Novo refresh token obtido:", refreshToken);
  } catch (error) {
    console.error("Erro ao atualizar o access token:", error.message);
    throw new Error("Falha ao atualizar o access token.");
  }
}

/**
 * Busca produtos na API do Mercado Livre com base na palavra-chave (nicho)
 * @param {string} nicho - Palavra-chave que define o nicho (ex: "maquiagem artística")
 * @returns {Promise<Array>} Array de produtos
 */
async function buscarProdutosPorNicho(nicho) {
  console.log("buscarProdutosPorNicho started for niche:", nicho);
  try {
    // Verifica e atualiza o access token se necessário
    if (!accessToken) {
      await atualizarAccessToken();
    }

    const limit = 100; // Define o número máximo de produtos retornados pela API
    const atalho = encodeURIComponent(nicho);
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${atalho}&limit=${limit}`;

    // Faz a requisição HTTP para a API do Mercado Livre
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Adiciona o token no cabeçalho
      },
    });
    console.log("API response received.");

    // Verifica se a resposta contém dados e retorna os produtos formatados
    if (response.data && response.data.results) {
      console.log("buscarProdutosPorNicho completed. Total products:", response.data.results.length);
      return response.data.results.map(produto => ({
        meli_id: produto.id,         // ID único do produto
        title: produto.title,        // Título do produto
        price: produto.price,        // Preço atual do produto
        original_price: produto.original_price || null,  // Preço original (se disponível)
        permalink: produto.permalink,  // Link para a página do produto
        thumbnail: produto.thumbnail,  // URL da imagem do produto
        sold_quantity: produto.sold_quantity || 0,  // Quantidade vendida
        rating: produto.rating_average || null  // Avaliação média (se disponível)
      }));
    }
    return [];
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('Erro 403: Acesso negado. Tentando atualizar o access token...');
      await atualizarAccessToken();
      return buscarProdutosPorNicho(nicho); // Tenta novamente após atualizar o token
    } else {
      console.error('Erro ao buscar produtos no Mercado Livre:', error.message);
    }
    return [];
  }
}

module.exports = buscarProdutosPorNicho;
