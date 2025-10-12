// script.js (Versão Final com Gerador de QR Code Híbrido)
document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api';
    const listaPresentesContainer = document.getElementById('lista-presentes');
    const presenteTemplate = document.getElementById('presente-template');
    const modal = document.getElementById('modal-pix');
    const closeModalBtn = document.querySelector('.fechar-modal');
    const pixInfoContainer = document.getElementById('pix-info');
    
    // ... (funções carregarPresentes e criarCardDePresente continuam iguais) ...
    async function carregarPresentes() {
        //...
    }
    function criarCardDePresente(presente) {
        //...
    }

    // --- FUNÇÃO ABRIRMODALPIX ATUALIZADA ---
    async function abrirModalPix(presente) {
        modal.style.display = 'block';
        pixInfoContainer.innerHTML = `<h3>Gerando QR Code com o valor do presente...</h3><p>Aguarde um instante.</p>`;
        
        try {
            // 1. Chama o backend para gerar o QR Code dinâmico
            const response = await fetch(`${API_URL}/presentes/${presente.id}/gerar-pix`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Não foi possível gerar o QR Code. Tente novamente.');
            }
            const data = await response.json(); // Recebe { qrCodeBase64, qrCodeText }

            // 2. Mostra o QR Code e o botão de confirmação
            pixInfoContainer.innerHTML = `
                <h3>Obrigado pelo seu carinho!</h3>
                <p>1. Escaneie o QR Code abaixo com o app do seu banco. O valor já está preenchido!</p>
                
                <div class="pix-manual-info">
                    <img src="${data.qrCodeBase64}" alt="QR Code Pix com valor" style="max-width: 250px; margin: 15px auto; display: block;">
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

            // 3. Lógica do botão de confirmação (continua a mesma)
            document.getElementById('btn-confirmar-pagamento').addEventListener('click', () => confirmarPagamento(presente));

        } catch (error) {
            pixInfoContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    // Função separada para a lógica de confirmação
    async function confirmarPagamento(presente) {
        const btnConfirmar = document.getElementById('btn-confirmar-pagamento');
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Confirmando...';

        try {
            const response = await fetch(`${API_URL}/presentes/${presente.id}/confirmar`, { method: 'PATCH' });
            if (!response.ok) { throw new Error('Não foi possível confirmar. Tente novamente.'); }
            
            alert('Muito obrigado pelo seu presente! Ele já foi atualizado na lista.');
            location.reload(); // Recarrega a página

        } catch (error) {
            alert(error.message);
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Já fiz o Pix! Confirmar Presente';
        }
    }

    function fecharModal() { modal.style.display = 'none'; }
    carregarPresentes();
    closeModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (event) => { if (event.target == modal) { fecharModal(); } });

    // Colando as funções que não mudaram para garantir que o código esteja completo
    async function carregarPresentes() {
        listaPresentesContainer.innerHTML = '<h2>Carregando presentes...</h2>';
        try {
            const response = await fetch(`${API_URL}/presentes`);
            if (!response.ok) { throw new Error('Não foi possível carregar os presentes. Aguarde um instante...'); }
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
});