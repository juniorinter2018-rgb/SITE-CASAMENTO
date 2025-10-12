// backend/server.js (Versão Final com Lógica de Cotas)
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db'); 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para buscar os presentes (continua igual)
app.get('/api/presentes', async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM presentes WHERE status = 'disponivel' ORDER BY valor");
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

// --- ROTA DE CONFIRMAÇÃO ATUALIZADA COM LÓGICA DE COTAS ---
app.patch('/api/presentes/:id/confirmar', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Busca o presente no banco para ver suas cotas
        const presenteResult = await db.query("SELECT * FROM presentes WHERE id = $1", [id]);
        if (presenteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Presente não encontrado.' });
        }
        const presente = presenteResult.rows[0];

        // 2. Se for um item de cota única ou a última cota
        if (presente.cotas_disponiveis <= 1) {
            // Marca como 'pago' e zera as cotas
            await db.query("UPDATE presentes SET status = 'pago', cotas_disponiveis = 0 WHERE id = $1", [id]);
        } else {
            // Apenas diminui o número de cotas disponíveis
            await db.query("UPDATE presentes SET cotas_disponiveis = cotas_disponiveis - 1 WHERE id = $1", [id]);
        }

        res.status(200).json({ message: 'Presente confirmado com sucesso!' });
    } catch (error) {
        console.error("Erro ao confirmar presente:", error);
        res.status(500).json({ error: 'Não foi possível confirmar o presente.' });
    }
});
// -----------------------------------------------------------

// Rota de "Fallback"
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});