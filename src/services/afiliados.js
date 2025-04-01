// src/services/afiliados.js
require('dotenv').config();

/**
 * Gera o link de afiliado a partir do URL original do produto.
 * @param {string} urlOriginal - URL original do produto
 * @returns {string} URL com parâmetros de afiliado
 */
function gerarLinkAfiliado(urlOriginal) {
  const base = process.env.AFILIADO_BASE_URL || 'https://www.mercadolivre.com.br/oferta?url=';
  const afiliadoId = process.env.AFILIADO_ID || '';
  const urlEncoded = encodeURIComponent(urlOriginal);
  return `${base}${urlEncoded}&aff_id=${afiliadoId}`;
}

module.exports = gerarLinkAfiliado;
