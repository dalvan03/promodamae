// src/services/imageGenerator.js
const sharp = require('sharp');
const path = require('path');

/**
 * Gera uma imagem personalizada para a postagem.
 * Esta função utiliza um template de imagem (por exemplo, um PNG exportado do PSD) e insere
 * informações do produto (como título, preço, desconto). 
 * 
 * OBS: Este é um exemplo básico usando a biblioteca sharp para sobrepor texto sobre uma imagem.
 * Você deverá adaptar esse código conforme a estrutura do seu template (camadas, posições, etc.).
 *
 * @param {Object} produto - Dados do produto para compor a imagem.
 * @returns {Promise<string>} Caminho para a imagem gerada (local ou URL)
 */
async function gerarImagemDoProduto(produto) {
  try {
    // Caminho do template base (exportado do PSD)
    const templatePath = path.join(__dirname, '../../assets/template.png');  // certifique-se de ter um template em assets/
    // Definir o caminho para salvar a imagem gerada
    const outputPath = path.join(__dirname, '../../outputs/', `${produto.meli_id}_${Date.now()}.png`);

    // Aqui usamos um exemplo simples: sobrepor texto na imagem usando sharp.
    // Se precisar manipular layers do PSD, você pode usar ferramentas especializadas ou processar o arquivo em outra etapa.
    // Por exemplo, desenhar o título e os preços na imagem:
    const image = sharp(templatePath);

    // Obtenha os metadados do template para definir posições relativas (exemplo)
    const metadata = await image.metadata();

    // Exemplo: criar um overlay de texto com o título e o desconto (usando SVG como overlay)
    const svgOverlay = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .title { fill: #ffffff; font-size: 48px; font-weight: bold; }
          .price { fill: #ffcc00; font-size: 36px; }
        </style>
        <text x="50" y="100" class="title">${produto.title}</text>
        <text x="50" y="170" class="price">De R$ ${produto.original_price} por R$ ${produto.price}</text>
      </svg>
    `;

    await image
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .png()
      .toFile(outputPath);

    console.log(`Imagem gerada para produto ${produto.meli_id}: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Erro ao gerar imagem:", error.message);
    return null;
  }
}

module.exports = gerarImagemDoProduto;
