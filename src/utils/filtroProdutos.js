// src/utils/filtroProdutos.js

/**
 * Filtra produtos em promoção (onde original_price > price) e calcula um score para ranqueamento.
 * @param {Array} produtos - Array de produtos brutos
 * @returns {Array} Array de produtos filtrados e ordenados por score (decrescente)
 */
function filtrarProdutosPromocao(produtos) {
    // Filtrar somente produtos que possuem:
    // - Preço original (original_price) maior que o preço atual (price)
    // - Campos essenciais como thumbnail (imagem), permalink (link), e title (título)
    const filtrados = produtos.filter(p => 
      p.original_price && p.original_price > p.price && p.thumbnail && p.permalink && p.title
    ).map(p => {
      // Calcular o percentual de desconto com base na diferença entre o preço original e o preço atual
      const descontoPct = ((p.original_price - p.price) / p.original_price) * 100;

      // Calcular um "score" para ranqueamento:
      // - O score combina o percentual de desconto com a quantidade de vendas (sold_quantity)
      // - A quantidade de vendas é normalizada (limitada a 1000) e ponderada com um peso de 0.01
      const score = descontoPct + Math.min(p.sold_quantity, 1000) * 0.01;

      // Retornar o produto com os novos campos calculados (descontoPct e score)
      return { ...p, descontoPct, score };
    });
  
    // Ordenar os produtos filtrados em ordem decrescente de score (do maior para o menor)
    return filtrados.sort((a, b) => b.score - a.score);
}
  
module.exports = filtrarProdutosPromocao;
