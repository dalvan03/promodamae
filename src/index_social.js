// src/index_social.js
require('dotenv').config();
const dayjs = require('dayjs');
const axios = require('axios');  // para delays, se necessário

const gerarTextoPostagem = require('./services/textPoster');
const gerarImagemDoProduto = require('./services/imageGenerator');
const socialPoster = require('./services/socialPoster');

// IDs e tokens para redes sociais (do .env)
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

// Exemplo: lista de produtos para postar (normalmente, essa lista viria do resultado da mineração)
const produtosParaPostar = [
  // Cada produto deve ter: meli_id, title, original_price, price, sold_quantity, link_afiliado, rating, etc.
  // Exemplo:
  {
    meli_id: "MLB123456789",
    title: "Kit de Maquiagem Artística Incrível",
    original_price: 120.00,
    price: 80.00,
    sold_quantity: 150,
    permalink: "https://produto.mercadolivre.com.br/MLB123456789-kit-maquiagem-artistica",
    thumbnail: "https://http2.mlstatic.com/D_NQ_NP_123456-MLB123456789.jpg",
    rating: 4.5,
    descontoPct: 33.33  // calculado previamente
  }
  // ... adicione mais produtos conforme necessário
];

/**
 * Processa a postagem de um produto:
 * 1. Gera textos para Instagram e Facebook.
 * 2. Gera a imagem personalizada.
 * 3. Posta nas redes sociais.
 * 
 * @param {Object} produto - Objeto com os dados do produto.
 */
async function processarPostagem(produto) {
  try {
    console.log(`\n[${dayjs().format()}] Iniciando postagem para produto: ${produto.title}`);

    // Gerar textos via OpenAI
    const textos = await gerarTextoPostagem(produto);
    console.log("Textos gerados:", textos);

    // Gerar imagem personalizada (retorna caminho ou URL local da imagem)
    const imagemPath = await gerarImagemDoProduto(produto);
    if (!imagemPath) {
      console.error("Imagem não gerada, pulando postagem para este produto.");
      return;
    }

    // Postar no Instagram Feed
    const instaFeedResp = await socialPoster.postToInstagramFeed(
      INSTAGRAM_USER_ID,
      imagemPath,  // Se precisar de uma URL pública, você deverá hospedar essa imagem ou integrá-la via CDN.
      textos.instagram,
      INSTAGRAM_ACCESS_TOKEN
    );
    console.log("Instagram Feed:", instaFeedResp);

    // Postar no Instagram Story
    const instaStoryResp = await socialPoster.postToInstagramStory(
      INSTAGRAM_USER_ID,
      imagemPath,
      INSTAGRAM_ACCESS_TOKEN
    );
    console.log("Instagram Story:", instaStoryResp);

    // Postar no Facebook Feed
    const fbFeedResp = await socialPoster.postToFacebookFeed(
      FACEBOOK_PAGE_ID,
      imagemPath,
      textos.facebook,
      FACEBOOK_ACCESS_TOKEN
    );
    console.log("Facebook Feed:", fbFeedResp);

    // Postar no Facebook Story
    const fbStoryResp = await socialPoster.postToFacebookStory(
      FACEBOOK_PAGE_ID,
      imagemPath,
      FACEBOOK_ACCESS_TOKEN
    );
    console.log("Facebook Story:", fbStoryResp);

  } catch (error) {
    console.error("Erro ao processar postagem:", error.message);
  }
}

/**
 * Função principal que itera sobre os produtos e posta-os.
 * Para evitar disparos muito próximos, podemos introduzir um delay entre postagens.
 */
async function executarPostagens() {
  console.log(`[${dayjs().format()}] Iniciando o fluxo de postagens...`);
  for (const produto of produtosParaPostar) {
    await processarPostagem(produto);
    // Aguarda 5 minutos entre postagens para espaçar as chamadas (ajuste conforme necessário)
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
  console.log(`[${dayjs().format()}] Fluxo de postagens concluído.`);
}

// Execução imediata (ou agende essa função conforme necessário)
executarPostagens().catch((err) => console.error('Erro na execução das postagens:', err));
