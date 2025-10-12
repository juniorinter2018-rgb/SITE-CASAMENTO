// backend/server.js (Plano Definitivo - Gerador Próprio)
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db'); 
const { crc16 } = require('crc'); // Importa a ferramenta de cálculo

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função para formatar o payload do Pix (versão mais compatível)
function gerarPayloadPix(chave, nome, cidade, valor) {
    nome = nome.substring(0, 25).toUpperCase();
    cidade = cidade.substring(0, 15).toUpperCase();
    const txid = '***'; // ID de transação genérico e universal
    const valorFormatado = valor.toFixed(2);

    const montaCampo = (id, valor) => {
        const tam = valor.length.toString().padStart(2, '0');
        return `${id}${tam}${valor}`;
    };

    const payload = [
        montaCampo('00', '01'),
        montaCampo('26', montaCampo('00', 'BR.GOV.BCB.PIX') + montaCampo('01', chave)),
        montaCampo('52', '0000'),
        montaCampo('53', '986'),
        montaCampo('54', valorFormatado),
        montaCampo('58', 'BR'),
        montaCampo('59', nome),
        montaCampo('60', cidade),
        montaCampo('62', montaCampo('05', txid))
    ].join('');

    const payloadComCrc = payload + '6304';
    const crcResult = crc16(payloadComCrc).toString(16).toUpperCase().padStart(4, '0');
    
    return payloadComCrc + crcResult;
}

// Rota para buscar os presentes
app.get('/api/presentes', async (req, res) => {
    try {
        const resultado = await db.query("SELECT * FROM presentes WHERE status = 'disponivel' ORDER BY valor");
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

// Rota para gerar o QR Code com valor (usando a nova função)
app.post('/api/presentes/:id/gerar-pix', async (req, res) => {
    try {
        const { id } = req.params;
        const presenteResult = await db.query("SELECT * FROM presentes WHERE id = $1", [id]);
        if (presenteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Presente não encontrado.' });
        }
        const presente = presenteResult.rows[0];
        const valorNumerico = parseFloat(presente.valor);

        const payload = gerarPayloadPix(
            'mariannavidal12345@gmail.com',
            'Marianna V S',
            'JOAOPESSOA',
            valorNumerico
        );

        // Usamos uma API super confiável apenas para desenhar a imagem
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;

        res.status(200).json({
            qrCodeImageUrl: qrCodeImageUrl,
            qrCodeText: payload
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code Pix:", error);
        res.status(500).json({ error: 'Falha ao gerar o QR Code.' });
    }
});

// Rota de confirmação
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
        res.status(200).json({ message: 'Confirmado!' });
    } catch (error) {
        res.status(500).json({ error: 'Não foi possível confirmar.' });
    }
});

// Rota de "Fallback"
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});