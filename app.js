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
        if (!/^https?:\/\/www\.lamoda\.ru\/p\/[a-zA-Z0-9]{10,}\//.test(url)) {
            throw new Error('Некорректная ссылка!\nПример: https://www.lamoda.ru/p/MP002XW1G0ZJ/...');
        }

        const html = await fetchWithRetry(url);
        const sku = extractSKU(html);
        
        resultCard.classList.add('success');
        resultContent.innerHTML = `
            <div class="sku-value">${sku}</div>
            <div class="sku-source">Источник: API Lamoda</div>
        `;

    } catch (error) {
        resultCard.classList.add('error');
        resultContent.innerHTML = `
            <div class="error-header">${error.message}</div>
            <div class="error-debug" style="display:none">${error.debug || ''}</div>
            <button onclick="toggleDebugInfo()" class="debug-btn">Техническая информация</button>
            <div class="manual-guide">
                <h3>Как найти вручную:</h3>
                <ol>
                    <li>Откройте DevTools (F12 → Вкладка Network)</li>
                    <li>Обновите страницу (Ctrl+R)</li>
                    <li>Ищите запросы с названием товара</li>
                    <li>Во вкладке Preview найдите "sku_supplier"</li>
                </ol>
            </div>
        `;
    } finally {
        urlInput.disabled = false;
        btn.classList.remove('loading');
    }
}

async function fetchWithRetry(url) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 20000);

    for (let i = 0; i < PROXIES.length; i++) {
        try {
            const response = await fetch(PROXIES[i] + encodeURIComponent(url), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                    'Referer': 'https://www.lamoda.ru/',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'ru-RU,ru;q=0.9'
                },
                signal: controller.signal
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            if (i === PROXIES.length - 1) {
                const err = new Error('Не удалось подключиться');
                err.debug = `Последняя ошибка: ${e.message}`;
                throw err;
            }
        }
    }
}

function extractSKU(html) {
    const patterns = [
        // Паттерн 1: Стандартный NUXT
        /window\.__NUXT__\s*=\s*({.*?});/s,
        
        // Паттерн 2: JSON-LD данные
        /"sku":\s*"(\d+)"/,
        
        // Паттерн 3: Встроенный JSON
        /"sku_supplier":\s*"(\d+)"/,
        
        // Паттерн 4: Минифицированный JSON
        /sku_supplier["']?:["']?(\d+)/,
        
        // Паттерн 5: URL параметры
        /sku=(\d+)/,
    ];

    for (const regex of patterns) {
        const match = html.match(regex);
        if (match) {
            try {
                const json = regex.test(/^\{/) ? JSON.parse(match[1]) : null;
                return json?.payload?.product?.sku_supplier || match[1];
            } catch (e) {
                return match[1];
            }
        }
    }
    
    throw new Error('SKU не обнаружен в коде страницы');
}

function toggleDebugInfo() {
    const debug = document.querySelector('.error-debug');
    debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
}
