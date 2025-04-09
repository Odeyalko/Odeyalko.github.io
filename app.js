const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://webproxy.101011.xyz/',
    'https://proxy.cors.sh/'
];

async function analyzeProduct() {
    const inputElem = document.getElementById('productUrl');
    const resultElem = document.querySelector('.result-content');
    const resultCard = document.getElementById('result');
    const btn = document.querySelector('button');

    inputElem.disabled = true;
    btn.classList.add('loading');
    resultCard.className = 'result-card';
    resultElem.innerHTML = '';

    try {
        const userInput = inputElem.value.trim();
        let url, originalSku;
        if (/^https?:\/\//i.test(userInput)) {
            // Введён полный URL.
            if (!/^https?:\/\/www\.lamoda\.ru\/p\/[a-zA-Z0-9]+\/.*$/i.test(userInput)) {
                throw new Error('Некорректная ссылка!\nПример: https://www.lamoda.ru/p/mp002xw05ezl/clothes-laurbaperson-futbolka/');
            }
            const match = userInput.match(/\/p\/([a-zA-Z0-9]+)/i);
            if (!match || !match[1]) throw new Error('SKU не найден в ссылке.');
            originalSku = match[1];
            url = userInput;
        } else if (/^[a-zA-Z0-9]+$/i.test(userInput)) {
            // Введён только SKU → формируем URL.
            originalSku = userInput;
            url = `https://www.lamoda.ru/p/${userInput}/`;
        } else {
            throw new Error('Введён неверный формат. Введите полный URL или SKU, состоящий только из букв и цифр.');
        }

        const html = await fetchHTML(url);
        const skuSupplier = extractSKU(html);
        // Формируем ссылку для перехода используя оригинальный SKU.
        const productLink = `https://www.lamoda.ru/p/${originalSku}/`;

        resultCard.classList.add('success');
        resultElem.innerHTML = `
            <div class="sku-value">${skuSupplier}</div>
            <div class="sku-link"><a href="${productLink}" target="_blank">Перейти на товар</a></div>
        `;
    } catch (error) {
        resultCard.classList.add('error');
        resultElem.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="manual-guide">
                <h3>Сделайте следующие:</h3>
                <ol>
                    <li>Введите полную ссылку вида:</li>
                    <li>https://www.lamoda.ru/p/mp002xw05ezl/clothes-laurbaperson-futbolka/</li>
                    <li>или просто SKU (например, mp002xw05ezl).</li>
                </ol>
            </div>
        `;
    } finally {
        inputElem.disabled = false;
        btn.classList.remove('loading');
    }
}

async function fetchHTML(url) {
    let lastError;
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
        } catch(e) {
            lastError = e;
        } finally {
            clearTimeout(timeout);
        }
    }
    throw new Error('Не удалось получить данные с сайта Lamoda. ' + (lastError ? lastError.message : ''));
}

function extractSKU(html) {
    // Ищем JSON-структуру, содержащую window.__NUXT__
    const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*({.*?});/s);
    if (nuxtMatch) {
        try {
            const data = JSON.parse(nuxtMatch[1]);
            let skuSupplier;
            // Основная попытка: data.payload.product.sku_supplier
            if (data?.payload?.product?.sku_supplier) {
                skuSupplier = data.payload.product.sku_supplier;
            }
            // Альтернативная попытка: data.payload.payload.product.sku_supplier
            else if (data?.payload?.payload?.product?.sku_supplier) {
                skuSupplier = data.payload.payload.product.sku_supplier;
            }
            if (skuSupplier) return skuSupplier;
        } catch (e) {
            console.error('Ошибка парсинга JSON из window.__NUXT__:', e);
        }
    }
    // Резервный метод — поиск строки "sku_supplier"
    const directMatch = html.match(/"sku_supplier":\s*"([^"]+)"/);
    if (directMatch && directMatch[1]) return directMatch[1];
    throw new Error('Поле sku_supplier не найдено в данных страницы.');
}
