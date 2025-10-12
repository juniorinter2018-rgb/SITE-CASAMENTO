// script.js (Plano do Link de Cobrança - Final e Definitivo)
document.addEventListener('DOMContentLoaded', () => {

    const MINHA_CHAVE_PIX = "mariannavidal12345@gmail.com";
    const API_URL = '/api';

    const listaPresentesContainer = document.getElementById('lista-presentes');
    const presenteTemplate = document.getElementById('presente-template');
    const modal = document.getElementById('modal-pix');
    const closeModalBtn = document.querySelector('.fechar-modal');
    const pixInfoContainer = document.getElementById('pix-info');

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

    function abrirModalPix(presente) {
        modal.style.display = 'block';
        const valorNumerico = parseFloat(presente.valor);
        const valorFormatadoParaLink = valorNumerico.toFixed(2);
        const valorFormatadoParaDisplay = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Monta um link de cobrança do Nubank
        const linkDeCobranca = `https://nubank.com.br/pagar/${MINHA_CHAVE_PIX}/${valorFormatadoParaLink}`;

        pixInfoContainer.innerHTML = `
            <h3>Obrigado pelo seu carinho! ❤️</h3>
            <p>Para facilitar, preparamos um link de pagamento com o valor já preenchido.</p>
            
            <div class="pix-manual-info">
                <a href="${linkDeCobranca}" target="_blank" class="link-pagamento-pix">
                    Clique aqui para Pagar ${valorFormatadoParaDisplay} com Pix
                </a>
                <p style="font-size: 0.9rem; margin-top: 15px;">Você será direcionado para uma página segura para escanear o QR Code ou copiar o código.</p>
            </div>

            <div class="aviso-importante">
                <p>Após pagar, volte para esta página e clique no botão abaixo para confirmar seu presente!</p>
                <button id="btn-confirmar-pagamento">Já paguei! Confirmar Presente</button>
            </div>
        `;
        
        document.getElementById('btn-confirmar-pagamento').addEventListener('click', () => confirmarPagamento(presente));
    }

    async function confirmarPagamento(presente) {
        const btnConfirmar = document.getElementById('btn-confirmar-pagamento');
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.textContent = 'Confirmando...';
        }
        try {
            const response = await fetch(`${API_URL}/presentes/${presente.id}/confirmar`, { method: 'PATCH' });
            if (!response.ok) { throw new Error('Não foi possível confirmar. Tente novamente.'); }
            
            alert('Muito obrigado pelo seu presente!');
            location.reload();

        } catch (error) {
            alert(error.message);
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = 'Já paguei! Confirmar Presente';
            }
        }
    }

    function fecharModal() {
        modal.style.display = 'none';
    }

    carregarPresentes();
    closeModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            fecharModal();
        }
    });
});