// src/services/textPoster.js
const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Gera textos para postagens a partir das informações do produto.
 * O prompt enviado ao OpenAI solicita um JSON com as chaves "instagram" e "facebook".
 * @param {Object} produto - Objeto com informações do produto (ex.: título, preço, desconto)
 * @returns {Promise<Object>} Objeto no formato: { instagram: "texto", facebook: "texto" }
 */
async function gerarTextoPostagem(produto) {
  try {
    const prompt = `Crie dois textos de postagem para redes sociais sobre o seguinte produto:\n
Título: ${produto.title}\n
Preço Promocional: ${produto.price}\n
Preço Original: ${produto.original_price}\n
Desconto: ${produto.descontoPct ? produto.descontoPct.toFixed(2) : 'N/A'}%\n
Volume de Vendas: ${produto.sold_quantity}\n
Link: ${produto.link_afiliado}\n
\n
Crie um texto curto para o Instagram (feed) e outro para o Facebook (feed) que destaquem essa oferta. Retorne apenas um JSON no formato:\n
{\n  "instagram": "Texto para Instagram",\n  "facebook": "Texto para Facebook"\n}\n
Não inclua explicações extras.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a creative social media copywriter." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const textos = JSON.parse(content);
    return textos;
  } catch (error) {
    console.error("Erro ao gerar textos de postagem:", error.message);
    return { instagram: "", facebook: "" };
  }
}

module.exports = gerarTextoPostagem;
