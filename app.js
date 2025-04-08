const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
    'https://api.codetabs.com/v1/proxy?quest='
];

async function analyzeProduct() {
    const urlInput = document.getElementById('productUrl');
    const resultContent = document.querySelector('.result-content');
    const resultCard = document.getElementById('result');
    const btn = document.querySelector('button');
    
    // Сброс состояния
    urlInput.disabled = true;
    btn.classList.add('loading');
    resultCard.className = 'result-card';
    resultContent.innerHTML = '';

    try {
        // Валидация URL
        const url = urlInput.value.trim();
        if (!isValidLamodaUrl(url)) {
            throw new Error('Некорректный URL. Пример правильной ссылки:\nhttps://www.lamoda.ru/p/MP002XW1G0ZJ/...');
        }

        // Получение данных
        const html = await fetchThroughProxies(url);
        const sku = extractSKU(html);
        
        // Отображение результата
        resultCard.classList.add('success');
        resultContent.innerHTML = `
            <div class="sku-display">${sku}</div>
            <div class="sku-path">window.__NUXT__.payload.product.sku_supplier</div>
        `;

    } catch (error) {
        resultCard.classList.add('error');
        resultContent.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="error-instructions">
                <h3>Решение проблем:</h3>
                <ul>
                    <li>Проверьте доступность сайта</li>
                    <li>Используйте VPN при необходимости</li>
                    <li>Свяжитесь с поддержкой</li>
                </ul>
            </div>
        `;
    } finally {
        urlInput.disabled = false;
        btn.classList.remove('loading');
    }
}

function isValidLamodaUrl(url) {
    return /^https?:\/\/www\.lamoda\.ru\/p\/[a-zA-Z0-9]{10,}\//.test(url);
}

async function fetchThroughProxies(url) {
    for (const proxy of PROXIES) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                    'Referer': 'https://www.lamoda.ru/'
                },
                timeout: 10000
            });
            
            if (!response.ok) continue;
            return await response.text();
        } catch(e) { continue; }
    }
    throw new Error('Не удалось подключиться через прокси');
}

function extractSKU(html) {
    const nuxtDataMatch = html.match(/window\.__NUXT__\s*=\s*({.*?});/s);
    if (!nuxtDataMatch) throw new Error('Данные товара не найдены');
    
    const nuxtData = JSON.parse(nuxtDataMatch[1]);
    const sku = nuxtData?.payload?.product?.sku_supplier;
    
    if (!sku) throw new Error('SKU Supplier не найден в данных');
    return sku;
}