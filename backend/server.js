// backend/server.js (Versão Final com Correção de Valor e Detetives)
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db'); 
const { QrCodePix } = require('qrcode-pix');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/presentes', async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM presentes WHERE status = 'disponivel' ORDER BY valor");
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar presentes:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});

app.post('/api/presentes/:id/gerar-pix', async (req, res) => {
    try {
        const { id } = req.params;

        const presenteResult = await db.query("SELECT * FROM presentes WHERE id = $1", [id]);
        if (presenteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Presente não encontrado.' });
        }
        const presente = presenteResult.rows[0];

        // --- NOSSOS DETETIVES E A CORREÇÃO ---
        console.log("--> Iniciando geração de PIX para o presente:", presente.nome);
        console.log("--> Valor vindo do banco (tipo):", typeof presente.valor, "| Valor:", presente.valor);
        // A conversão usando parseFloat é mais robusta para números com casas decimais
        const valorNumerico = parseFloat(presente.valor);
        console.log("--> Valor após conversão para Número (tipo):", typeof valorNumerico, "| Valor:", valorNumerico);
        // ------------------------------------

        const pix = QrCodePix({
            version: '01',
            key: 'mariannavidal12345@gmail.com',
            name: 'Marianna Vidal da Silva',
            city: 'JOAO PESSOA',
            transactionId: `casamento${id}${Date.now()}`,
            amount: valorNumerico, // Usando a variável que garantimos ser um número
        });

        const qrCodeBase64 = await pix.base64();
        const qrCodeText = pix.payload();

        res.status(200).json({
            qrCodeBase64: qrCodeBase64,
            qrCodeText: qrCodeText
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code Pix:", error);
        res.status(500).json({ error: 'Falha ao gerar o QR Code.' });
    }
});

app.patch('/api/presentes/:id/confirmar', async (req, res) => {
    try {
        const { id } = req.params;
        const presenteResult = await db.query("SELECT * FROM presentes WHERE id = $1", [id]);
        if (presenteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Presente não encontrado.' });
        }
        const presente = presenteResult.rows[0];
        if (presente.cotas_disponiveis <= 1) {
            await db.query("UPDATE presentes SET status = 'pago', cotas_disponiveis = 0 WHERE id = $1", [id]);
        } else {
            await db.query("UPDATE presentes SET cotas_disponiveis = cotas_disponiveis - 1 WHERE id = $1", [id]);
        }
        res.status(200).json({ message: 'Presente confirmado com sucesso!' });
    } catch (error) {
        console.error("Erro ao confirmar presente:", error);
        res.status(500).json({ error: 'Não foi possível confirmar o presente.' });
    }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});