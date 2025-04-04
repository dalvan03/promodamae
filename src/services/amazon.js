/**
 * Integração com Amazon Product Advertising API (v5) – serviço de busca de produtos.
 */
const aws4 = require('aws4');  // Biblioteca para assinar requisições AWS (Signature v4)
const https = require('https'); // Módulo HTTPS nativo para realizar requisições

// Configurações de credenciais e padrão de locale (marketplace)
const AMAZON_CONFIG = {
  accessKey: 'SUA_ACCESS_KEY_ID_AQUI',      // Chave de Acesso (Access Key ID da PA API)
  secretKey: 'SUA_SECRET_KEY_AQUI',         // Chave Secreta (Secret Access Key)
  partnerTag: 'SEU_ID_AFILIADO-20',         // Tag de associado (tracking ID), ex: "meuloja-20"
  locale: 'BR'                              // Marketplace padrão: 'BR' (Brasil). Pode ser alterado para 'US', 'AU', etc.
};

// Mapeamento de locais Amazon para host e região (necessário para assinatura)
const AWS_LOCALES = {
  'BR': { host: 'webservices.amazon.com.br', region: 'us-east-1', marketplace: 'www.amazon.com.br' },
  'US': { host: 'webservices.amazon.com',    region: 'us-east-1', marketplace: 'www.amazon.com' },
  'AU': { host: 'webservices.amazon.com.au', region: 'us-west-2', marketplace: 'www.amazon.com.au' }
  // Podemos adicionar outros marketplaces suportados futuramente, seguindo a documentação da Amazon&#8203;:contentReference[oaicite:11]{index=11}.
};

/**
 * Busca produtos na Amazon PA API por palavra-chave e categoria.
 * @param {string} keywords - Termos de busca (palavras-chave).
 * @param {string} [searchIndex] - Índice de busca (categoria Amazon, ex: "Electronics", "Books"...). Opcional.
 * @param {string} [locale] - Marketplace (código do país: 'BR', 'US', 'AU'...). Opcional (padrão = 'BR').
 * @returns {Promise<Array<Object>>} - Promessa que resolve em uma lista de objetos contendo dados dos produtos encontrados.
 */
async function searchProducts(keywords, searchIndex, locale) {
  const loc = locale || AMAZON_CONFIG.locale;
  const endpoint = AWS_LOCALES[loc] || AWS_LOCALES['BR'];
  const { host, region, marketplace } = endpoint;

  // Monta o payload da requisição SearchItems conforme a API Amazon
  const requestPayload = {
    Keywords: keywords,
    ...(searchIndex ? { SearchIndex: searchIndex } : {}), // inclui SearchIndex somente se fornecido
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Classifications.ProductGroup',
      'Images.Primary.Small',
      'Images.Primary.Large',
      'Offers.Listings.Price',
      'Offers.Listings.SavingBasis',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
      'BrowseNodeInfo.WebsiteSalesRank',
      'BrowseNodeInfo.BrowseNodes'
    ],
    PartnerTag: AMAZON_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: marketplace
  };

  // Configura os parâmetros da requisição HTTP (usaremos aws4 para assinar)
  const requestOptions = {
    host: host,
    path: '/paapi5/searchitems',
    method: 'POST',
    service: 'ProductAdvertisingAPIv1', // Nome do serviço para assinatura (conforme documentação PA API)&#8203;:contentReference[oaicite:12]{index=12}
    region: region,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(requestPayload)
  };

  // Assina a requisição adicionando os cabeçalhos de Autorização (Signature) necessários
  aws4.sign(requestOptions, {
    accessKeyId: AMAZON_CONFIG.accessKey,
    secretAccessKey: AMAZON_CONFIG.secretKey
  });
  // Após esta chamada, requestOptions.headers conterá as chaves:
  // - Authorization, X-Amz-Date, e a assinatura apropriada, além de Content-Type que definimos.

  // Envia a requisição HTTPS e retorna uma Promise
  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.Errors) {
            // Se a API retornou um erro, rejeita a Promise com a mensagem
            return reject(new Error(data.Errors[0].Message));
          }
          // Extrai os itens do resultado
          const items = data.SearchResult && data.SearchResult.Items ? data.SearchResult.Items : [];
          // Mapeia cada item para um objeto com os campos de interesse
          const results = items.map(item => {
            const info = item.ItemInfo || {};
            const offers = item.Offers || {};
            const images = item.Images || {};
            const browseInfo = item.BrowseNodeInfo || {};

            // Título do produto
            const title = info.Title && info.Title.DisplayValue ? info.Title.DisplayValue : null;
            // Categoria (ProductGroup ou nome do primeiro BrowseNode)
            let category = null;
            if (info.Classifications && info.Classifications.ProductGroup) {
              category = info.Classifications.ProductGroup.DisplayValue;
            }
            if (!category && browseInfo.BrowseNodes && browseInfo.BrowseNodes.length > 0) {
              // Pega o nome da primeira categoria (DisplayName) se ProductGroup não estiver disponível
              category = browseInfo.BrowseNodes[0].DisplayName || browseInfo.BrowseNodes[0].ContextFreeName;
            }

            // Preço atual e preço original (se disponível)
            let price = null;
            let originalPrice = null;
            if (offers.Listings && offers.Listings.length > 0) {
              const listing = offers.Listings[0];
              if (listing.Price) {
                // Preço atual (por exemplo, "R$ 120,00")
                price = listing.Price.DisplayAmount || listing.Price.Amount;
              }
              if (listing.SavingBasis) {
                // Preço original (riscado) se SavingBasis estiver presente
                originalPrice = listing.SavingBasis.DisplayAmount || listing.SavingBasis.Amount;
              } else if (listing.Price) {
                // Se não há SavingBasis, assumimos que não há desconto: preço original = preço atual
                originalPrice = listing.Price.DisplayAmount || listing.Price.Amount;
              }
            }

            // Avaliações (número de reviews e nota)
            let totalReviews = null;
            let rating = null;
            if (info.CustomerReviews) {
              if (info.CustomerReviews.Count) {
                totalReviews = info.CustomerReviews.Count.DisplayValue || info.CustomerReviews.Count; 
              }
              if (info.CustomerReviews.StarRating) {
                rating = info.CustomerReviews.StarRating.DisplayValue || info.CustomerReviews.StarRating;
              }
            }
            // Nota: Se totalReviews ou rating vierem como objeto, extraímos DisplayValue; caso contrário, pode já vir numérico.

            // Popularidade (Sales Rank)
            let salesRank = null;
            if (browseInfo.WebsiteSalesRank) {
              salesRank = browseInfo.WebsiteSalesRank.SalesRank;
            } else if (browseInfo.BrowseNodes && browseInfo.BrowseNodes.length > 0) {
              // Tenta pegar o SalesRank da primeira categoria, se disponível
              salesRank = browseInfo.BrowseNodes[0].SalesRank;
            }

            // URLs de imagem
            let smallImage = null;
            let largeImage = null;
            if (images.Primary) {
              if (images.Primary.Small && images.Primary.Small.URL) {
                smallImage = images.Primary.Small.URL;
              }
              if (images.Primary.Large && images.Primary.Large.URL) {
                largeImage = images.Primary.Large.URL;
              }
            }

            // Link para a página do produto na Amazon (pode ser usado para gerar link de afiliado adicionando tag se necessário)
            const detailPageURL = item.DetailPageURL;

            return {
              asin: item.ASIN,
              title,
              category,
              price,
              originalPrice,
              totalReviews,
              rating,
              salesRank,
              smallImage,
              largeImage,
              detailPageURL
            };
          });
          resolve(results);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    // Envia o payload JSON na requisição
    req.write(requestOptions.body);
    req.end();
  });
}

module.exports = {
  searchProducts
};
