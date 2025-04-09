const PROXIES = [
  "https://api.allorigins.hexocode.repl.co/raw?url=",
  "https://thingproxy.freeboard.io/fetch/",
  "https://yacdn.org/proxy/"
];

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const inputElem = document.getElementById('productUrl');
  const resultContainer = document.querySelector('#result .result-content');
  const spinner = document.getElementById('loading');
  
  // Очистка предыдущего результата
  resultContainer.innerHTML = "";
  
  const userInput = inputElem.value.trim();
  if (!userInput) {
    document.getElementById('result').innerHTML = '<p style="color:red;">Введите ссылку или SKU.</p>';
    return;
  }
  
  let productUrl = userInput;
  let originalSku;
  
  // Если введён только SKU, формируем URL
  if (!userInput.startsWith('http')) {
    originalSku = userInput;
    productUrl = `https://www.lamoda.ru/p/${userInput}/`;
  } else {
    const match = userInput.match(/\/p\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      originalSku = match[1];
    } else {
      document.getElementById('result').innerHTML = '<p style="color:red;">Неверный формат ссылки.</p>';
      return;
    }
  }
  
  // Показываем спиннер
  spinner.classList.remove('hidden');
  
  try {
    const html = await fetchHTML(productUrl);
    const skuSupplier = extractSKU(html);
    const productLink = `https://www.lamoda.ru/p/${originalSku}/`;
    
    document.getElementById('result').innerHTML = `
      <div class="result-content">
        <div class="sku-value">${skuSupplier}</div>
        <div class="sku-link"><a href="${productLink}" target="_blank">Перейти на товар</a></div>
      </div>
    `;
  } catch (error) {
    document.getElementById('result').innerHTML = `
      <div class="result-content">
        <div class="error-message" style="color:red;">Ошибка: ${error.message}</div>
        <div class="manual-guide">
          <h3>Сделайте следующие:</h3>
          <ol>
            <li>Введите полную ссылку вида:</li>
            <li>https://www.lamoda.ru/p/mp002xw05ezl/clothes-laurbaperson-futbolka/</li>
            <li>или просто SKU (например, mp002xw05ezl).</li>
          </ol>
        </div>
      </div>
    `;
  } finally {
    spinner.classList.add('hidden');
  }
});

async function fetchHTML(url) {
  let lastError;
  for (const proxy of PROXIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(proxy + encodeURIComponent(url), {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Referer': 'https://www.lamoda.ru/',
          'Origin': 'https://www.lamoda.ru',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9',
          'Cache-Control': 'no-cache',
          'sec-ch-ua': `"Chromium";v="115", "Not A;Brand";v="24", "Google Chrome";v="115"`,
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
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
  // Попытка извлечь JSON из переменной window.__NUXT__
  const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*({.*?});/s);
  if (nuxtMatch) {
    try {
      const data = JSON.parse(nuxtMatch[1]);
      if (data?.payload?.product?.sku_supplier) {
        return data.payload.product.sku_supplier;
      } else if (data?.payload?.payload?.product?.sku_supplier) {
        return data.payload.payload.product.sku_supplier;
      }
    } catch (e) {
      console.error('Ошибка парсинга JSON:', e);
    }
  }
  // Резервный поиск через регулярное выражение
  const directMatch = html.match(/"sku_supplier":\s*"([^"]+)"/);
  if (directMatch && directMatch[1]) return directMatch[1];
  
  throw new Error('Поле sku_supplier не найдено.');
}
