// script.js (Plano B Definitivo - Completo)
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES PESSOAIS ---
    const MINHA_CHAVE_PIX = "mariannavidal12345@gmail.com";
    const MEU_NOME_PIX = "Marianna Vidal da Silva - Nubank";
    const MEU_NUMERO_WHATSAPP = "5583981367568";

    // --- CONFIGURAÇÕES DO SITE ---
    const API_URL = '/api';

    // --- MAPEAMENTO DOS ELEMENTOS DA PÁGINA ---
    const listaPresentesContainer = document.getElementById('lista-presentes');
    const presenteTemplate = document.getElementById('presente-template');
    const modal = document.getElementById('modal-pix');
    const closeModalBtn = document.querySelector('.fechar-modal');
    const pixInfoContainer = document.getElementById('pix-info');
    
    // --- GERAÇÃO DO LINK WHATSAPP ---
    const WHATSAPP_LINK_BASE = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=Oi!%20Acabei%20de%20dar%20um%20presente%20para%20os%20noivos%20Marianna%20e%20Renato!%20Segue%20o%20comprovante%20do:`;


    // ===================================
    // FUNÇÕES PRINCIPAIS
    // ===================================

    /**
     * Busca os presentes da API e os exibe na tela.
     */
    async function carregarPresentes() {
        listaPresentesContainer.innerHTML = '<h2>Carregando presentes...</h2>';
        try {
            const response = await fetch(`${API_URL}/presentes`);
            if (!response.ok) { throw new Error('Não foi possível carregar os presentes. Aguarde um instante...'); }
            const presentes = await response.json();
            listaPresentesContainer.innerHTML = ''; 
            if (presentes.length === 0) { 
                listaPresentesContainer.innerHTML = '<h2>Nenhum presente disponível no momento.</h2>'; 
                return; 
            }
            presentes.forEach(presente => { 
                const card = criarCardDePresente(presente); 
                listaPresentesContainer.appendChild(card); 
            });
        } catch (error) { 
            console.error("Erro ao carregar presentes:", error); 
            listaPresentesContainer.innerHTML = `<h2 style="color: red;">${error.message}</h2>`; 
        }
    }

    /**
     * Cria o elemento HTML (card) para um presente.
     */
    function criarCardDePresente(presente) {
        const cardClone = presenteTemplate.content.cloneNode(true);
        const cardElement = cardClone.firstElementChild;
        cardElement.querySelector('.presente-img').src = presente.imagem_url;
        cardElement.querySelector('.presente-img').alt = presente.nome;
        cardElement.querySelector('.presente-nome').textContent = presente.nome;
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(presente.valor);
        cardElement.querySelector('.presente-preco').textContent = precoFormatado;
        const cotasElement = cardElement.querySelector('.presente-cotas');
        if (presente.cotas_total > 1) { 
            cotasElement.textContent = `Disponível ${presente.cotas_disponiveis} de ${presente.cotas_total} cotas`; 
        } else { 
            cotasElement.style.display = 'none'; 
        }
        cardElement.querySelector('.btn-presentear').addEventListener('click', () => { abrirModalPix(presente); });
        return cardElement;
    }

    /**
     * Abre o modal, gera o QR Code dinâmico e exibe as opções.
     */
    async function abrirModalPix(presente) {
        modal.style.display = 'block';
        pixInfoContainer.innerHTML = `<h3>Gerando QR Code com o valor do presente...</h3><p>Aguarde um instante.</p>`;
        
        try {
            const response = await fetch(`${API_URL}/presentes/${presente.id}/gerar-pix`, { method: 'POST' });
            if (!response.ok) { throw new Error('Não foi possível gerar o QR Code. Tente novamente.'); }
            const data = await response.json();

            pixInfoContainer.innerHTML = `
                <h3>Obrigado pelo seu carinho!</h3>
                <p>1. Escaneie o QR Code abaixo com o app do seu banco. O valor já está preenchido!</p>
                <div class="pix-manual-info">
                    <img src="${data.qrCodeImageUrl}" alt="QR Code Pix com valor" style="max-width: 250px; margin: 15px auto; display: block;">
                    <strong>Ou use o Pix Copia e Cola:</strong>
                    <input type="text" value="${data.qrCodeText}" readonly id="pix-copia-cola">
                    <button id="btn-copiar">Copiar Código</button>
                </div>
                <div class="aviso-importante">
                    <p>2. Após pagar, clique no botão abaixo para confirmar seu presente!</p>
                    <button id="btn-confirmar-pagamento">Já fiz o Pix! Confirmar Presente</button>
                </div>
            `;
            
            document.getElementById('btn-copiar').addEventListener('click', () => {
                const input = document.getElementById('pix-copia-cola');
                input.select();
                document.execCommand('copy');
                alert('Código Pix copiado!');
            });

            document.getElementById('btn-confirmar-pagamento').addEventListener('click', () => confirmarPagamento(presente));

        } catch (error) {
            console.error("Erro ao abrir modal:", error);
            pixInfoContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    /**
     * Confirma o pagamento, atualiza a UI e redireciona para o WhatsApp.
     */
    async function confirmarPagamento(presente) {
        const btnConfirmar = document.getElementById('btn-confirmar-pagamento');
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.textContent = 'Confirmando...';
        }

        try {
            const response = await fetch(`${API_URL}/presentes/${presente.id}/confirmar`, { method: 'PATCH' });
            if (!response.ok) { throw new Error('Não foi possível confirmar. Tente novamente.'); }
            
            pixInfoContainer.innerHTML = `
                <div style="text-align: center;">
                    <h2>Presente Confirmado! ✅</h2>
                    <p>Muito obrigado pelo seu carinho! ❤️</p>
                    <p>Você será redirecionado para o WhatsApp para nos enviar o comprovante em alguns segundos...</p>
                </div>
            `;
            const linkWhatsAppCompleto = `${WHATSAPP_LINK_BASE}%20*${presente.nome}*`;
            setTimeout(() => {
                window.location.href = linkWhatsAppCompleto;
            }, 3000);

        } catch (error) {
            alert(error.message);
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = 'Já fiz o Pix! Confirmar Presente';
            }
        }
    }

    /**
     * Fecha o modal.
     */
    function fecharModal() {
        modal.style.display = 'none';
    }


    // ===================================
    // INICIALIZAÇÃO E EVENTOS
    // ===================================
    carregarPresentes();
    closeModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            fecharModal();
        }
    });

});