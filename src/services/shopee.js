const axios = require('axios');
const crypto = require('crypto');

const SHOPEE_PARTNER_ID = process.env.SHOPEE_PARTNER_ID;
const SHOPEE_PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY;
const SHOPEE_SHOP_ID = process.env.SHOPEE_SHOP_ID;
const SHOPEE_API_BASE_URL = 'https://partner.shopeemobile.com/api/v2';

/**
 * Gera o hash de assinatura necessário para autenticação nas chamadas da API da Shopee.
 * @param {string} path - O caminho da API sendo chamado.
 * @param {number} timestamp - O timestamp atual.
 * @returns {string} - O hash de assinatura.
 */
function generateSignature(path, timestamp) {
    const baseString = `${SHOPEE_PARTNER_ID}${path}${timestamp}${SHOPEE_PARTNER_KEY}${SHOPEE_SHOP_ID}`;
    return crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
}

/**
 * Obtém a lista de categorias disponíveis na Shopee.
 * @returns {Promise<Array>} - Uma promessa que resolve para uma lista de categorias.
 */
async function getCategories() {
    const path = '/product/get_category';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSignature(path, timestamp);

    const response = await axios.get(`${SHOPEE_API_BASE_URL}${path}`, {
        params: {
            partner_id: SHOPEE_PARTNER_ID,
            shop_id: SHOPEE_SHOP_ID,
            timestamp: timestamp,
            sign: sign,
        },
    });

    return response.data.response.category_list;
}

/**
 * Busca produtos na Shopee com base em palavras-chave e categoria.
 * @param {string} keyword - A palavra-chave para a busca.
 * @param {number} categoryId - O ID da categoria para filtrar os resultados.
 * @param {number} limit - O número de resultados a serem retornados.
 * @param {number} offset - O deslocamento para paginação.
 * @returns {Promise<Array>} - Uma promessa que resolve para uma lista de produtos.
 */
async function searchProducts(keyword, categoryId = null, limit = 10, offset = 0) {
    const path = '/product/search';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSignature(path, timestamp);

    const params = {
        partner_id: SHOPEE_PARTNER_ID,
        shop_id: SHOPEE_SHOP_ID,
        timestamp: timestamp,
        sign: sign,
        keyword: keyword,
        limit: limit,
        offset: offset,
    };

    if (categoryId) {
        params.category_id = categoryId;
    }

    const response = await axios.get(`${SHOPEE_API_BASE_URL}${path}`, { params });

    return response.data.response.items;
}

module.exports = {
    getCategories,
    searchProducts,
};
