// src/services/sheets.js
const { google } = require('googleapis');
require('dotenv').config();

// Configure as credenciais de serviço (conta de serviço) para Google Sheets
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const auth = new google.auth.JWT(
  serviceAccountEmail,
  null,
  privateKey,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Salva os dados de um nicho na planilha.
 * @param {string} nicho - Nome do nicho (pode ser usado para definir a aba)
 * @param {Array} dados - Array de arrays representando as linhas a serem inseridas
 */
async function salvarNaPlanilha(nicho, dados) {
  try {
    // Defina o range como uma aba com o nome do nicho (crie a aba previamente ou use a aba padrão)
    const range = `${nicho}!A:F`;

    const resource = {
      values: dados
    };

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource
    });

    console.log(`Linhas adicionadas: ${result.data.updates.updatedRows}`);
  } catch (error) {
    console.error('Erro ao salvar dados na planilha:', error.message);
  }
}

module.exports = salvarNaPlanilha;
