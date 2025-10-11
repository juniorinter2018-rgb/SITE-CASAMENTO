// backend/server.js (Versão Final de Produção)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// A rota que está faltando
app.get('/api/presentes', async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM presentes WHERE status = 'disponivel' ORDER BY valor");
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});