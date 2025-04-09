const proxyBase = 'https://odeyalko-proxy.onrender.com/proxy?url=';

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const inputElem = document.getElementById('productUrl');
  const resultContainer = document.querySelector('#result .result-content');
  const spinner = document.getElementById('loading');

  const userInput = inputElem.value.trim();
  if (!userInput) {
    document.getElementById('result').innerHTML = '<p style="color: red;">Введите ссылку или SKU.</p>';
    return;
  }

  let productUrl = userInput;
  let originalSku;
  if (!userInput.startsWith('http')) {
    // Если введён только SKU
    originalSku = userInput;
    productUrl = `https://www.lamoda.ru/p/${userInput}/`;
  } else {
    const match = userInput.match(/\/p\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      originalSku = match[1];
    } else {
      document.getElementById('result').innerHTML = '<p style="color: red;">Неверный формат ссылки.</p>';
      return;
    }
  }

  // Показываем спиннер
  spinner.classList.remove('hidden');

  try {
    const response = await fetch(proxyBase + encodeURIComponent(productUrl));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

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
        <div class="error-message" style="color: red;">Ошибка: ${error.message}</div>
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

function extractSKU(html) {
  // Ищем JSON-структуру, содержащую window.__NUXT__
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
      console.error('Ошибка при парсинге JSON: ', e);
    }
  }
  // Резервный метод — поиск по строке "sku_supplier"
  const directMatch = html.match(/"sku_supplier":\s*"([^"]+)"/);
  if (directMatch && directMatch[1]) return directMatch[1];
  throw new Error('Поле sku_supplier не найдено в данных страницы.');
}
