// src/utils/filtroProdutos.js

/**
 * Filtra produtos em promoção (onde original_price > price) e calcula um score para ranqueamento.
 * @param {Array} produtos - Array de produtos brutos
 * @returns {Array} Array de produtos filtrados e ordenados por score (decrescente)
 */
function filtrarProdutosPromocao(produtos) {
    // Filtrar somente produtos com promoção e campos essenciais
    const filtrados = produtos.filter(p => 
      p.original_price && p.original_price > p.price && p.thumbnail && p.permalink && p.title
    ).map(p => {
      // Calcular percentual de desconto
      const descontoPct = ((p.original_price - p.price) / p.original_price) * 100;
      // Exemplo de fórmula de score: desconto + (vendas normalizadas)
      // Usando sold_quantity diretamente; ajuste a ponderação se necessário
      const score = descontoPct + Math.min(p.sold_quantity, 1000) * 0.01;
      return { ...p, descontoPct, score };
    });
  
    // Ordenar por score decrescente
    return filtrados.sort((a, b) => b.score - a.score);
  }
  
  module.exports = filtrarProdutosPromocao;
  