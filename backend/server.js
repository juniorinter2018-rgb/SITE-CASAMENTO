// backend/server.js (Versão Final "Super Simplificada")
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

        const valorNumerico = parseFloat(presente.valor);

        // --- VERSÃO SUPER SIMPLIFICADA PARA GARANTIR A FORMATAÇÃO ---
        const pix = QrCodePix({
            version: '01',
            key: 'mariannavidal12345@gmail.com', // Sua chave Pix
            name: 'Marianna V S', // Nome simplificado (até 25 caracteres)
            city: 'JOAOPESSOA', // Cidade simplificada (até 15 caracteres)
            transactionId: '***', // ID de transação padrão do Pix (essencial para alguns apps)
            amount: valorNumerico,
        });
        // -----------------------------------------------------------

        console.log("--> Payload do PIX gerado:", pix.payload()); // Novo detetive

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

// ... (O resto do seu server.js continua igual e não precisa ser colado aqui de novo) ...
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