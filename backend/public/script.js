// script.js (Versão Final Completa)
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    let todosOsPresentes = [];
    const listaPresentesContainer = document.getElementById('lista-presentes');
    const presenteTemplate = document.getElementById('presente-template');
    const modal = document.getElementById('modal-pix');
    const closeModalBtn = document.querySelector('.fechar-modal');
    const pixInfoContainer = document.getElementById('pix-info');
    const seletorOrdenacao = document.getElementById('ordenar-presentes');
    const WHATSAPP_LINK_BASE = `https://wa.me/5583981367568?text=Oi!%20Acabei%20de%20dar%20um%20presente%20para%20os%20noivos%20Marianna%20e%20Renato!%20Segue%20o%20comprovante%20do:`;

    // Função para a Contagem Regressiva
    function iniciarContagemRegressiva() {
        const dataCasamento = new Date('2025-11-21T17:00:00').getTime(); // Data ajustada para 21 de Novembro
        const elementoContagem = document.getElementById('contagem-regressiva');

        if (!elementoContagem) return;

        const atualizarContagem = () => {
            const agora = new Date().getTime();
            const diferenca = dataCasamento - agora;

            if (diferenca < 0) {
                elementoContagem.innerHTML = "O grande dia chegou!";
                clearInterval(intervalo);
                return;
            }

            const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
            const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

            elementoContagem.innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
        };

        const intervalo = setInterval(atualizarContagem, 1000);
        atualizarContagem();
    }

    async function carregarPresentes() {
        listaPresentesContainer.innerHTML = '<h2>Carregando presentes...</h2>';
        try {
            const response = await fetch(`${API_URL}/presentes`);
            if (!response.ok) { throw new Error('Não foi possível carregar os presentes.'); }
            todosOsPresentes = await response.json();
            renderizarPresentes(todosOsPresentes);
        } catch (error) {
            console.error("Erro:", error);
            listaPresentesContainer.innerHTML = `<h2 style="color: red;">${error.message}</h2>`;
        }
    }

    function renderizarPresentes(lista) {
        listaPresentesContainer.innerHTML = '';
        if (lista.length === 0) { listaPresentesContainer.innerHTML = '<h2>Nenhum presente disponível.</h2>'; return; }
        lista.forEach(p => { const card = criarCardDePresente(p); listaPresentesContainer.appendChild(card); });
    }

    function criarCardDePresente(presente) {
        const cardClone = presenteTemplate.content.cloneNode(true);
        const cardElement = cardClone.firstElementChild;
        cardElement.querySelector('.presente-img').src = presente.imagem_url;
        cardElement.querySelector('.presente-nome').textContent = presente.nome;
        const precoF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(presente.valor);
        cardElement.querySelector('.presente-preco').textContent = precoF;
        const cotasEl = cardElement.querySelector('.presente-cotas');
        if (presente.cotas_total > 1) { cotasEl.textContent = `Disponível ${presente.cotas_disponiveis} de ${presente.cotas_total} cotas`; } else { cotasEl.style.display = 'none'; }
        cardElement.querySelector('.btn-presentear').addEventListener('click', () => abrirModalPix(presente));
        return cardElement;
    }

    function abrirModalPix(presente) {
        modal.style.display = 'block';

        if (!presente.pix_copia_e_cola) {
            pixInfoContainer.innerHTML = `<p style="color: red;">Não foi possível gerar o Pix para este presente. Por favor, escolha outro.</p>`;
            return;
        }

        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(presente.pix_copia_e_cola)}`;

        pixInfoContainer.innerHTML = `
            <h3>Obrigado pelo seu carinho! ❤️</h3>
            <p>1. Escaneie o QR Code abaixo com o app do seu banco. O valor já está preenchido!</p>
            <div class="pix-manual-info">
                <img src="${qrCodeImageUrl}" alt="QR Code Pix" style="max-width: 250px; margin: 15px auto; display: block; border: 5px solid white; border-radius: 10px;">
                <strong>Ou use o Pix Copia e Cola:</strong>
                <input type="text" value="${presente.pix_copia_e_cola}" readonly id="pix-copia-cola">
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
    }

    async function confirmarPagamento(presente) {
        const btn = document.getElementById('btn-confirmar-pagamento');
        if (btn) { btn.disabled = true; btn.textContent = 'Confirmando...'; }
        try {
            const response = await fetch(`${API_URL}/presentes/${presente.id}/confirmar`, { method: 'PATCH' });
            if (!response.ok) { throw new Error('Não foi possível confirmar.'); }

            pixInfoContainer.innerHTML = `<div style="text-align: center;"><h2>Presente Confirmado! ✅</h2><p>Muito obrigado! ❤️</p><p>Você será redirecionado para o WhatsApp...</p></div>`;
            const linkWhats = `${WHATSAPP_LINK_BASE}%20*${presente.nome}*`;
            setTimeout(() => { window.location.href = linkWhats; }, 3000);

        } catch (error) {
            alert(error.message);
            if (btn) { btn.disabled = false; btn.textContent = 'Já fiz o Pix!'; }
        }
    }

    function fecharModal() { modal.style.display = 'none'; }

    // Inicializações
    iniciarContagemRegressiva();
    carregarPresentes();

    // Event Listeners
    closeModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => { if (event.target == modal) { fecharModal(); } });
    seletorOrdenacao.addEventListener('change', () => {
        const ordem = seletorOrdenacao.value;
        let presentesOrdenados = [...todosOsPresentes];
        if (ordem === 'menor-preco') { presentesOrdenados.sort((a, b) => parseFloat(a.valor) - parseFloat(b.valor)); }
        else if (ordem === 'maior-preco') { presentesOrdenados.sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor)); }
        renderizarPresentes(presentesOrdenados);
    });

    // Efeito Parallax
    const imagemHero = document.querySelector('.hero-imagem');
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;
        if (imagemHero) { imagemHero.style.transform = `translateY(${scrollPos * 0.3}px)`; }
    });
});