// script.js (Versão Final de Produção)
document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // ÁREA DE CONFIGURAÇÃO - Seus dados
    // ===================================================================
    const MINHA_CHAVE_PIX = "mariannavidal12345@gmail.com";
    const MEU_NOME_PIX = "Marianna Vidal da Silva - Nubank";
    const MEU_NUMERO_WHATSAPP = "5583981367568";
    // ===================================================================

    // URL da sua API online na Render (já preenchida)
    const API_URL = 'const API_URL = '/api
    // ===================================================================

    const listaPresentesContainer = document.getElementById('lista-presentes');
    const presenteTemplate = document.getElementById('presente-template');
    const modal = document.getElementById('modal-pix');
    const closeModalBtn = document.querySelector('.fechar-modal');
    const pixInfoContainer = document.getElementById('pix-info');
    
    const WHATSAPP_LINK_BASE = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=Oi!%20Acabei%20de%20dar%20um%20presente%20para%20os%20doidos%20Marianna%20e%20Renato!%20Segue%20o%20comprovante%20do:`;

    async function carregarPresentes() {
        listaPresentesContainer.innerHTML = '<h2>Carregando presentes...</h2>';
        try {
            const response = await fetch(`${API_URL}/presentes`);
            if (!response.ok) { throw new Error('Não foi possível carregar os presentes. Aguarde um instante, o servidor pode estar "acordando".'); }
            const presentes = await response.json();
            listaPresentesContainer.innerHTML = ''; 
            if (presentes.length === 0) { listaPresentesContainer.innerHTML = '<h2>Nenhum presente disponível no momento.</h2>'; return; }
            presentes.forEach(presente => { const card = criarCardDePresente(presente); listaPresentesContainer.appendChild(card); });
        } catch (error) { console.error("Erro:", error); listaPresentesContainer.innerHTML = `<h2 style="color: red;">${error.message}</h2>`; }
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
        if (presente.cotas_total > 1) { cotasElement.textContent = `Disponível ${presente.cotas_disponiveis} de ${presente.cotas_total} cotas`; } else { cotasElement.style.display = 'none'; }
        cardElement.querySelector('.btn-presentear').addEventListener('click', () => { abrirModalPix(presente); });
        return cardElement;
    }

    function abrirModalPix(presente) {
        modal.style.display = 'block';
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(presente.valor);
        const linkWhatsAppCompleto = `${WHATSAPP_LINK_BASE}%20*${presente.nome}*`;
        pixInfoContainer.innerHTML = `
            <h3>Obrigado pelo seu carinho!</h3>
            <p>Para nos presentear com <strong>${presente.nome}</strong>, faça um Pix no valor de <strong>${valorFormatado}</strong> usando a chave abaixo.</p>
            <div class="pix-manual-info">
                <strong>Chave Pix (E-mail):</strong>
                <input type="text" value="${MINHA_CHAVE_PIX}" readonly id="pix-copia-cola">
                <button id="btn-copiar">Copiar Chave</button>
                <p><small><strong>Nome:</strong> ${MEU_NOME_PIX}</small></p>
            </div>
            <p class="aviso-importante">
                <strong>IMPORTANTE:</strong> Após o pagamento, por favor, nos avise
                <a href="${linkWhatsAppCompleto}" target="_blank">clicando aqui para nos mandar o comprovante</a>,
                para que possamos remover o presente da lista!
            </p>
        `;
        document.getElementById('btn-copiar').addEventListener('click', () => {
            const input = document.getElementById('pix-copia-cola');
            input.select();
            document.execCommand('copy');
            alert('Chave Pix copiada!');
        });
    }

    function fecharModal() { modal.style.display = 'none'; }
    carregarPresentes();
    closeModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => { if (event.target == modal) { fecharModal(); } });
});