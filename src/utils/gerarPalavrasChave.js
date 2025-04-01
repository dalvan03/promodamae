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
  console.log("gerarPalavrasChave started:", tema);
  try {
    // Criar o prompt para a API da OpenAI, solicitando 5 palavras-chave únicas
    const prompt = `For the theme "${tema}", generate a JSON object with exactly 5 unique, relevant keywords.
The JSON must have the following format:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
Return only the JSON object without any extra text or explanation.`;

    // Fazer a requisição para a API da OpenAI usando o modelo GPT-3.5-turbo
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo", // Modelo utilizado para gerar as palavras-chave
        messages: [
          { role: "system", content: "You are a helpful assistant." }, // Define o comportamento do modelo
          { role: "user", content: prompt } // Envia o prompt com o tema para a API
        ],
        temperature: 0.7, // Controla a criatividade da resposta (valores mais baixos = respostas mais previsíveis)
        max_tokens: 150 // Limita o número de tokens na resposta para evitar respostas muito longas
      },
      {
        headers: {
          'Content-Type': 'application/json', // Define o tipo de conteúdo da requisição
          'Authorization': `Bearer ${OPENAI_API_KEY}` // Autenticação com a chave da API
        }
      }
    );

    // Extrair o conteúdo da resposta da API e convertê-lo de JSON para objeto
    const content = response.data.choices[0].message.content.trim();
    const jsonResponse = JSON.parse(content);
    console.log("gerarPalavrasChave response received:", jsonResponse);

    // Validar se a resposta contém o array de palavras-chave
    if (!jsonResponse.keywords || !Array.isArray(jsonResponse.keywords)) {
      throw new Error("Invalid JSON structure: missing 'keywords' array");
    }

    // Garantir que as palavras-chave sejam únicas, não vazias e exatamente 5
    const keywords = [...new Set(jsonResponse.keywords.map(kw => kw.trim()).filter(Boolean))];
    if (keywords.length !== 5) {
      console.warn(`Expected 5 keywords, but got ${keywords.length}. Truncating to 5.`);
      const truncated = keywords.slice(0, 5);
      console.log("gerarPalavrasChave completed with truncated keywords:", truncated);
      return truncated; // Truncar para 5 palavras-chave, se necessário
    }
    console.log("gerarPalavrasChave completed successfully:", keywords);
    return keywords;
  } catch (error) {
    // Capturar e exibir erros, retornando um array vazio como fallback
    console.error("Erro ao gerar palavras-chave:", error.message);
    return [];
  }
}

module.exports = gerarPalavrasChave;
