// backend/server.js (Versão Final "Tudo em Um")
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Pacote para lidar com caminhos de arquivos
const db = require('./db'); 

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- PARTE NOVA: SERVIR OS ARQUIVOS DO SITE ---
// Diz ao Express para tratar a pasta 'public' como a raiz do nosso site
app.use(express.static(path.join(__dirname, 'public')));
// ---------------------------------------------

// Rota da API (continua a mesma)
app.get('/api/presentes', async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM presentes WHERE status = 'disponivel' ORDER BY valor");
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// --- PARTE NOVA: ROTA DE "FALLBACK" ---
// Se nenhuma rota da API for encontrada, manda o index.html como resposta.
// Isso é importante para o roteamento em sites mais complexos (SPAs).
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ----------------------------------------

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});