// backend/server.js (Versão Final com Gerador de QR Code Híbrido)
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db'); 
const { qrCodePix } = require('qrcode-pix'); // 1. Importa a nova ferramenta

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

// --- ROTA NOVA PARA GERAR O QR CODE COM VALOR ---
app.post('/api/presentes/:id/gerar-pix', async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o presente no banco para pegar o valor
        const presenteResult = await db.query("SELECT * FROM presentes WHERE id = $1", [id]);
        if (presenteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Presente não encontrado.' });
        }
        const presente = presenteResult.rows[0];

        // 2. Cria a imagem do QR Code Pix com os seus dados
        const pix = qrCodePix({
            version: '01',
            key: 'mariannavidal12345@gmail.com', // Sua chave Pix
            name: 'Marianna Vidal da Silva', // Seu nome (até 25 caracteres)
            city: 'JOAO PESSOA', // Sua cidade (até 15 caracteres)
            transactionId: `casamento${id}${Date.now()}`, // ID único da transação (opcional)
            amount: Number(presente.valor), // O valor do presente!
        });

        const qrCodeBase64 = await pix.base64(); // Gera a imagem
        const qrCodeText = pix.payload(); // Gera o código "Copia e Cola"

        // 3. Envia os dados do Pix de volta para o frontend
        res.status(200).json({
            qrCodeBase64: qrCodeBase64,
            qrCodeText: qrCodeText
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code Pix:", error);
        res.status(500).json({ error: 'Falha ao gerar o QR Code.' });
    }
});

// Rota de confirmação (continua a mesma)
app.patch('/api/presentes/:id/confirmar', async (req, res) => {
    // ... (este código continua o mesmo da lógica de cotas) ...
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

// Rota de "Fallback" (continua a mesma)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});