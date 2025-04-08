const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://webproxy.101011.xyz/',
    'https://proxy.cors.sh/'
];

async function analyzeProduct() {
    const urlInput = document.getElementById('productUrl');
    const resultContent = document.querySelector('.result-content');
    const resultCard = document.getElementById('result');
    const btn = document.querySelector('button');

    urlInput.disabled = true;
    btn.classList.add('loading');
    resultCard.className = 'result-card';
    resultContent.innerHTML = '';

    try {
        const url = urlInput.value.trim();
        if (!isValidLamodaUrl(url)) {
            throw new Error('Некорректная ссылка!\nПример: https://www.lamoda.ru/p/MP002XW1G0ZJ/...');
        }

        const html = await fetchHTML(url);
        const sku = extractSKU(html);

        resultCard.classList.add('success');
        resultContent.innerHTML = `
            <div class="sku-value">${sku}</div>
            <div class="sku-source">Источник: Lamoda (из исходного кода страницы)</div>
        `;
    } catch (error) {
        resultCard.classList.add('error');
        resultContent.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="manual-guide">
                <h3>Ручной поиск:</h3>
                <ol>
                    <li>Откройте DevTools (F12).</li>
                    <li>Перейдите на вкладку Network и обновите страницу.</li>
                    <li>Найдите запрос, содержащий данные товара.</li>
                    <li>В ответе (Response) ищите поле "<strong>sku_supplier</strong>".</li>
                </ol>
            </div>
        `;
    } finally {
        urlInput.disabled = false;
        btn.classList.remove('loading');
    }
}

function isValidLamodaUrl(url) {
    // Проверяем, что URL соответствует шаблону Lamoda
    return /^https?:\/\/www\.lamoda\.ru\/p\/[a-zA-Z0-9]{10,}\//.test(url);
}

async function fetchHTML(url) {
    let lastError = null;
    for (const proxy of PROXIES) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(proxy + encodeURIComponent(url), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                    'Referer': 'https://www.lamoda.ru/',
                    'Accept-Language': 'ru-RU,ru;q=0.9'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }
            return await response.text();
        } catch (e) {
            lastError = e;
        } finally {
            clearTimeout(timeout);
        }
    }
    throw new Error('Не удалось получить данные с сайта Lamoda. ' + (lastError ? lastError.message : ''));
}

function extractSKU(html) {
    // Поиск JSON-структуры, содержащей переменную __NUXT__
    const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*({.*?});/s);
    if (nuxtMatch) {
        try {
            const data = JSON.parse(nuxtMatch[1]);
            const sku = data?.payload?.product?.sku_supplier;
            if (sku) return sku;
        } catch (e) {
            console.error('Ошибка парсинга JSON из window.__NUXT__:', e);
        }
    }
    // Резервный поиск по строке "sku_supplier"
    const directMatch = html.match(/"sku_supplier":\s*"([^"]+)"/);
    if (directMatch) return directMatch[1];

    throw new Error('Поле sku_supplier не найдено в данных страницы.');
}
