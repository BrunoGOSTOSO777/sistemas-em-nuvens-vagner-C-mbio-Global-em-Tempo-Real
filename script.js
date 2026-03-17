const currencies = {
    "USD": "Dólar Americano", "BRL": "Real Brasileiro", "EUR": "Euro",
    "GBP": "Libra Esterlina", "JPY": "Iene Japonês", "CAD": "Dólar Canadense",
    "AUD": "Dólar Australiano", "CHF": "Franco Suíço"
};

const locales = {
    "USD": "en-US", "BRL": "pt-BR", "EUR": "de-DE", 
    "GBP": "en-GB", "JPY": "ja-JP", "CAD": "en-CA", 
    "AUD": "en-AU", "CHF": "de-CH"
};

const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('from-currency');
const toCurrencySelect = document.getElementById('to-currency');
const swapBtn = document.getElementById('swap-btn');
const resultPanel = document.getElementById('result-panel');
const finalResult = document.getElementById('final-result');
const rateInfo = document.getElementById('rate-info');
const errorMsg = document.getElementById('error-msg');

let exchangeRates = {};
let typingTimer;

function init() {
    populateSelects();
    loadPreferences(); 
    fetchRates();
}

function populateSelects() {
    Object.keys(currencies).forEach(currency => {
        const option1 = new Option(`${currency} - ${currencies[currency]}`, currency);
        const option2 = new Option(`${currency} - ${currencies[currency]}`, currency);
        fromCurrencySelect.add(option1);
        toCurrencySelect.add(option2);
    });
}

async function fetchRates() {
    // Usando a API pública e aberta (sem risco de bloquear por falta de chave)
    const apiUrl = 'https://open.er-api.com/v6/latest/USD';
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if(data.result === "success") {
            // CORREÇÃO AQUI: Aceita tanto o formato de API pública quanto o da API com Chave
            exchangeRates = data.rates || data.conversion_rates;
            
            // Se já tiver valor salvo ou digitado, converte imediatamente após carregar a API
            if(amountInput.value) performConversion();
        } else {
            throw new Error("Erro na API");
        }
    } catch (error) {
        console.error("Erro ao buscar as taxas:", error);
        // Desativa o input se a API não funcionar para não quebrar o site
        amountInput.disabled = true;
        amountInput.placeholder = "Servidor indisponível";
    }
}

function calculateConversion(amount, from, to) {
    const rateFrom = exchangeRates[from];
    const rateTo = exchangeRates[to];
    const amountInUSD = amount / rateFrom;
    const finalAmount = amountInUSD * rateTo;
    const directRate = rateTo / rateFrom;
    return { finalAmount, directRate };
}

function performConversion() {
    const amountText = amountInput.value;
    const amount = parseFloat(amountText);
    const from = fromCurrencySelect.value;
    const to = toCurrencySelect.value;

    savePreferences(from, to);

    if (amountText === "") {
        amountInput.style.borderColor = 'var(--border-color)';
        errorMsg.style.display = 'none';
        resultPanel.classList.add('hidden');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        amountInput.style.borderColor = 'var(--error-color)';
        errorMsg.style.display = 'block';
        resultPanel.classList.add('hidden');
        return;
    }

    amountInput.style.borderColor = 'var(--border-color)';
    errorMsg.style.display = 'none';
    resultPanel.classList.remove('hidden');

    finalResult.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    rateInfo.innerText = 'Calculando em tempo real...';

    // TRAVA DE SEGURANÇA AQUI: Só faz a matemática se tiver certeza que os dados chegaram
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) return;

    clearTimeout(typingTimer);
    
    typingTimer = setTimeout(() => {
        const { finalAmount, directRate } = calculateConversion(amount, from, to);

        const formattedResult = new Intl.NumberFormat(locales[to] || 'pt-BR', {
            style: 'currency', currency: to
        }).format(finalAmount);

        const formattedRate = new Intl.NumberFormat(locales[to] || 'pt-BR', {
            style: 'currency', currency: to, minimumFractionDigits: 4
        }).format(directRate);

        finalResult.innerText = formattedResult;
        rateInfo.innerText = `1 ${from} = ${formattedRate}`;
    }, 300);
}

amountInput.addEventListener('input', performConversion);
fromCurrencySelect.addEventListener('change', performConversion);
toCurrencySelect.addEventListener('change', performConversion);

swapBtn.addEventListener('click', () => {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    performConversion();
});

function savePreferences(from, to) {
    localStorage.setItem('nomadPay_from', from);
    localStorage.setItem('nomadPay_to', to);
}

function loadPreferences() {
    const savedFrom = localStorage.getItem('nomadPay_from');
    const savedTo = localStorage.getItem('nomadPay_to');

    fromCurrencySelect.value = savedFrom ? savedFrom : 'USD';
    toCurrencySelect.value = savedTo ? savedTo : 'BRL';
}

init();