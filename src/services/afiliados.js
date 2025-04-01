// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

/**
 * Gera o link de afiliado a partir do URL original do produto.
 * Este link é usado para rastrear vendas e comissões de afiliados.
 * 
 * @param {string} urlOriginal - URL original do produto
 * @returns {string} URL com parâmetros de afiliado
 */
function gerarLinkAfiliado(urlOriginal) {
  // Base do link de afiliado, obtida das variáveis de ambiente ou com valor padrão
  const base = process.env.AFILIADO_BASE_URL || 'https://www.mercadolivre.com.br/oferta?url=';
  
  // ID do afiliado, obtido das variáveis de ambiente ou vazio por padrão
  const afiliadoId = process.env.AFILIADO_ID || '';
  
  // Codifica o URL original para ser usado como parâmetro em um link
  const urlEncoded = encodeURIComponent(urlOriginal);
  
  // Retorna o link completo com os parâmetros de afiliado
  return `${base}${urlEncoded}&aff_id=${afiliadoId}`;
}

// Exporta a função para uso em outros módulos
module.exports = gerarLinkAfiliado;
