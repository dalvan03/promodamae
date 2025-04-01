// src/services/socialPoster.js
const axios = require('axios');
require('dotenv').config();

/**
 * Posta uma imagem no Feed do Instagram.
 * @param {string} igUserId - ID da conta Instagram Business.
 * @param {string} imageUrl - URL pública da imagem.
 * @param {string} caption - Legenda do post.
 * @param {string} accessToken - Token de acesso para a conta Instagram.
 * @returns {Promise<Object>} Resposta da API.
 */
async function postToInstagramFeed(igUserId, imageUrl, caption, accessToken) {
  try {
    // Etapa 1: Cria o contêiner de mídia
    const createResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        }
      }
    );
    const creationId = createResponse.data.id;
    // Etapa 2: Publica o contêiner
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken
        }
      }
    );
    return publishResponse.data;
  } catch (error) {
    console.error('Erro ao postar no Instagram Feed:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Posta uma imagem no Instagram Stories.
 * @param {string} igUserId - ID da conta Instagram Business.
 * @param {string} imageUrl - URL pública da imagem.
 * @param {string} accessToken - Token de acesso.
 * @returns {Promise<Object>} Resposta da API.
 */
async function postToInstagramStory(igUserId, imageUrl, accessToken) {
  try {
    // Na criação do contêiner, indique media_type=STORIES
    const createResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          media_type: 'STORIES',
          access_token: accessToken
        }
      }
    );
    const creationId = createResponse.data.id;
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken
        }
      }
    );
    return publishResponse.data;
  } catch (error) {
    console.error('Erro ao postar no Instagram Story:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Posta uma imagem no Feed do Facebook.
 * @param {string} pageId - ID da Página do Facebook.
 * @param {string} imageUrl - URL pública da imagem.
 * @param {string} message - Mensagem para o post.
 * @param {string} accessToken - Token de acesso para a página.
 * @returns {Promise<Object>} Resposta da API.
 */
async function postToFacebookFeed(pageId, imageUrl, message, accessToken) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          message: message,
          access_token: accessToken
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao postar no Facebook Feed:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Posta uma imagem nos Stories do Facebook.
 * Processo:
 * 1. Upload da imagem como não publicada: POST /{page-id}/photos?published=false
 * 2. Publica o story usando o endpoint /{page-id}/photo_stories com o photo_id.
 * @param {string} pageId - ID da Página do Facebook.
 * @param {string} imageUrl - URL pública da imagem.
 * @param {string} accessToken - Token de acesso para a página.
 * @returns {Promise<Object>} Resposta da API.
 */
async function postToFacebookStory(pageId, imageUrl, accessToken) {
  try {
    // Etapa 1: Upload da foto não publicada
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          published: false,
          access_token: accessToken
        }
      }
    );
    const photoId = uploadResponse.data.id;
    // Etapa 2: Publicar como Story
    const storyResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photo_stories`,
      null,
      {
        params: {
          photo_id: photoId,
          access_token: accessToken
        }
      }
    );
    return storyResponse.data;
  } catch (error) {
    console.error('Erro ao postar no Facebook Story:', error.response ? error.response.data : error.message);
    return null;
  }
}

module.exports = {
  postToInstagramFeed,
  postToInstagramStory,
  postToFacebookFeed,
  postToFacebookStory
};
