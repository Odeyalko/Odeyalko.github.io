function analyzeProduct() {
    const urlInput = document.getElementById('productUrl');
    const resultContent = document.querySelector('.result-content');
    const resultCard = document.getElementById('result');
    const btn = document.querySelector('button');

    urlInput.disabled = true;
    btn.classList.add('loading');
    resultCard.className = 'result-card';
    resultContent.innerHTML = '';

    try {
        const input = urlInput.value.trim();
        const sku = parseInput(input);

        // Формируем ссылку на товар по sku
        const productLink = `https://www.lamoda.ru/p/${sku}/`;

        resultCard.classList.add('success');
        resultContent.innerHTML = `
            <div class="sku-value">${sku}</div>
            <div class="sku-link"><a href="${productLink}" target="_blank">Перейти на товар</a></div>
        `;
    } catch (error) {
        resultCard.classList.add('error');
        resultContent.innerHTML = `
            <div class="error-message">${error.message}</div>
            <div class="manual-guide">
                <h3>Ручной поиск:</h3>
                <ol>
                    <li>Вводите полную ссылку вида:</li>
                    <li>https://www.lamoda.ru/p/mp002xw05ezl/clothes-laurbaperson-futbolka/</li>
                    <li>или просто SKU (например, mp002xw05ezl).</li>
                </ol>
            </div>
        `;
    } finally {
        urlInput.disabled = false;
        btn.classList.remove('loading');
    }
}

/**
 * Функция parseInput анализирует ввод:
 * - Если это URL, извлекает SKU из URL.
 * - Если это просто SKU (последовательность букв/цифр), возвращает его.
 */
function parseInput(input) {
    // Если строка начинается с http:// или https://, считаем, что это URL.
    if (/^https?:\/\//i.test(input)) {
        // Проверяем, что URL соответствует формату Lamoda.
        if (!/^https?:\/\/www\.lamoda\.ru\/p\/[a-zA-Z0-9]+\/.+/i.test(input)) {
            throw new Error('Некорректная ссылка!\nПример: https://www.lamoda.ru/p/mp002xw05ezl/clothes-laurbaperson-futbolka/');
        }
        const match = input.match(/\/p\/([a-zA-Z0-9]+)\//i);
        if (match && match[1]) {
            return match[1];
        }
        throw new Error('SKU не найден в ссылке.');
    } else {
        // Если введённая строка не URL, проверяем соответствует ли она формату SKU.
        if (/^[a-zA-Z0-9]+$/.test(input)) {
            return input;
        }
        throw new Error('Введён неверный формат. Введите полный URL или SKU, состоящий только из букв и цифр.');
    }
}
