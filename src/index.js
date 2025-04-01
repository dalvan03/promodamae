// src/index.js
require('dotenv').config();
const dayjs = require('dayjs');
const cron = require('node-cron');

const buscarProdutosPorNicho = require('./services/mercadoLivre');
const filtrarProdutosPromocao = require('./utils/filtroProdutos');
const gerarLinkAfiliado = require('./services/afiliados');
const salvarNaPlanilha = require('./services/sheets');
const { upsertProduto, inserirHistoricoPreco } = require('./services/db');
const gerarPalavrasChave = require('./utils/gerarPalavrasChave');

// Lista de 50 nichos (palavras-chave genéricas)
// Exemplo simplificado; substitua pelos 50 nichos desejados
const nichos = [
  'maquiagem artística', 'motos de trilha', 'camionetes gipe', 'carros de arrancada',
  'itens para bebês', 'itens de cozinha', 'moda feminina', 'tecnologia', 'decoração', 'livros',
  'esportes', 'fitness', 'jardinagem', 'brinquedos', 'eletrônicos', 'acessórios de moda',
  'viagens', 'automóveis', 'pet shop', 'música', 'arte', 'culinária', 'beleza', 'hardware',
  'software', 'jogos', 'ferramentas', 'casamento', 'escolar', 'oficina', 'calçados',
  'móveis', 'relógios', 'óculos', 'papelaria', 'instrumentos musicais', 'acampamento',
  'moda masculina', 'produtos ecológicos', 'produtos de luxo', 'produtos infantis', 'sustentabilidade',
  'produtos para escritório', 'produtos para home office', 'saúde', 'bem-estar', 'produtos esportivos', 'energia'
];

const TOTAL_PRODUTOS_POR_NICHO = 30;

// Função para executar a mineração para todos os nichos
async function executarMineracao() {
  console.log(`[${dayjs().format()}] Iniciando mineração diária...`);

  for (const nicho of nichos) {
    console.log(`Processando nicho: ${nicho}`);

    try {
      // 1. Gerar (opcional) palavras-chave via OpenAI (pode ser usado para enriquecer a busca)
      // const keywords = await gerarPalavrasChave(nicho);
      // console.log(`Palavras-chave geradas para ${nicho}: ${keywords.join(', ')}`);

      // 2. Buscar produtos no Mercado Livre para o nicho
      const produtosBrutos = await buscarProdutosPorNicho(nicho);
      if (!produtosBrutos || produtosBrutos.length === 0) {
        console.log(`Nenhum produto encontrado para: ${nicho}`);
        continue;
      }

      // 3. Filtrar produtos que estão em promoção e calcular score
      const produtosFiltrados = filtrarProdutosPromocao(produtosBrutos);

      // 4. Selecionar os top 30 produtos (com base no score)
      const produtosSelecionados = produtosFiltrados.slice(0, TOTAL_PRODUTOS_POR_NICHO);

      // 5. Processar cada produto: gerar link afiliado, salvar em Supabase e preparar dados para Sheets
      const dataHoje = dayjs().format('YYYY-MM-DD');
      let dadosSheets = [];

      for (const produto of produtosSelecionados) {
        // Gerar link de afiliado
        produto.link_afiliado = gerarLinkAfiliado(produto.permalink);

        // Acrescentar o nicho (para registro)
        produto.nicho = nicho;
        produto.marketplace = 'Mercado Livre';
        produto.data = dataHoje;

        // Salvar ou atualizar o produto no Supabase
        const upsertResult = await upsertProduto(produto);
        // Supondo que upsertProduto retorne os dados inseridos com o id do produto
        // Se o produto não for retornado, precisamos obter o id pelo meli_id
        let produtoId;
        if (upsertResult && upsertResult.length > 0) {
          produtoId = upsertResult[0].id;
        } else {
          console.error(`Falha ao inserir produto ${produto.meli_id}`);
          continue;
        }

        // Inserir o registro de histórico de preço
        await inserirHistoricoPreco(
          produtoId,
          produto.original_price,
          produto.price,
          dataHoje
        );

        // Preparar dados para Sheets: [Data, Nicho, Título, Preço Original, Preço Promocional, Desconto %, Vendidos, Link Afiliado, Rating]
        const descontoPct = produto.original_price && produto.original_price > produto.price
          ? (((produto.original_price - produto.price) / produto.original_price) * 100).toFixed(2)
          : '0';
        dadosSheets.push([
          dataHoje,
          nicho,
          produto.title,
          produto.original_price,
          produto.price,
          descontoPct,
          produto.sold_quantity || 0,
          produto.link_afiliado,
          produto.rating || 'N/A'
        ]);
      }

      // 6. Enviar os dados para o Google Sheets (por nicho ou consolidado)
      if (dadosSheets.length > 0) {
        await salvarNaPlanilha(nicho, dadosSheets);
        console.log(`Nicho "${nicho}": ${dadosSheets.length} produtos enviados ao Google Sheets.`);
      }
    } catch (err) {
      console.error(`Erro ao processar nicho "${nicho}":`, err.message);
    }
  }

  console.log(`[${dayjs().format()}] Mineração diária concluída.`);
}

// Agendamento via cron: executar diariamente às 03:00 (ajuste conforme necessário)
cron.schedule('0 3 * * *', () => {
  executarMineracao().catch((err) => console.error('Erro na execução agendada:', err));
});

// Para execução imediata (ex: durante testes), descomente a linha abaixo:
// executarMineracao();
