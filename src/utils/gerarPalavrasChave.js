// src/utils/gerarPalavrasChave.js
const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Gera 5 palavras-chave únicas para um tema, retornando um array.
 * O prompt exige resposta em JSON no formato:
 * { "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"] }
 * @param {string} tema - O tema para gerar as palavras-chave
 * @returns {Promise<Array>} Array de palavras-chave
 */
async function gerarPalavrasChave(tema) {
  try {
    const prompt = `For the theme "${tema}", generate a JSON object with exactly 5 unique, relevant keywords.
The JSON must have the following format:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
Return only the JSON object without any extra text or explanation.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
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
    const jsonResponse = JSON.parse(content);
    if (!jsonResponse.keywords || !Array.isArray(jsonResponse.keywords)) {
      throw new Error("Invalid JSON structure: missing 'keywords' array");
    }
    // Garantir unicidade e exatamente 5 palavras
    const keywords = [...new Set(jsonResponse.keywords.map(kw => kw.trim()).filter(Boolean))];
    if (keywords.length !== 5) {
      console.warn(`Expected 5 keywords, but got ${keywords.length}. Truncating to 5.`);
      return keywords.slice(0, 5);
    }
    return keywords;
  } catch (error) {
    console.error("Erro ao gerar palavras-chave:", error.message);
    return [];
  }
}

module.exports = gerarPalavrasChave;
