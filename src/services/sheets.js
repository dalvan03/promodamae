const { google } = require('googleapis');
require('dotenv').config();

// Configure as credenciais de serviço (conta de serviço) para Google Sheets
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID; // ID da planilha no Google Sheets
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL; // E-mail da conta de serviço
let privateKey = process.env.GOOGLE_PRIVATE_KEY; // Chave privada da conta de serviço
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n'); // Substitui caracteres de nova linha para evitar erros
}

// Configura a autenticação com a API do Google Sheets
const auth = new google.auth.JWT(
  serviceAccountEmail,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/spreadsheets'] // Permissão para acessar e editar planilhas
);

const sheets = google.sheets({ version: 'v4', auth }); // Inicializa o cliente da API do Google Sheets

/**
 * Salva os dados de um nicho na planilha.
 * @param {string} nicho - Nome do nicho (pode ser usado para definir a aba)
 * @param {Array} dados - Array de arrays representando as linhas a serem inseridas
 */
async function salvarNaPlanilha(nicho, dados) {
  try {
    // Define o range como uma aba com o nome do nicho (a aba deve existir previamente)
    const range = `${nicho}!A:F`;

    const resource = {
      values: dados // Dados a serem inseridos na planilha
    };

    // Adiciona os dados na planilha usando o método "append"
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId, // ID da planilha
      range, // Aba e colunas onde os dados serão inseridos
      valueInputOption: 'USER_ENTERED', // Insere os dados como se fossem digitados pelo usuário
      resource // Dados a serem inseridos
    });

    console.log(`Linhas adicionadas: ${result.data.updates.updatedRows}`); // Exibe o número de linhas adicionadas
  } catch (error) {
    console.error('Erro ao salvar dados na planilha:', error.message); // Exibe erros no console
  }
}

module.exports = salvarNaPlanilha;
