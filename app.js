const proxyBase = 'https://odeyalko-proxy.onrender.com/proxy?url=';

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const input = document.getElementById('productUrl').value.trim();
    const resultDiv = document.getElementById('result');
    const loading = document.getElementById('loading');

    if (!input) {
        resultDiv.innerHTML = '<p style="color: red;">Введите ссылку или артикул.</p>';
        return;
    }

    let productUrl = input;
    if (!input.startsWith('http')) {
        productUrl = `https://www.lamoda.ru/p/${input}/`;
    }

    loading.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const html = await fetchHTML(productUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const supplierElement = doc.querySelector('[data-qa="supplier-sku"]');

        if (supplierElement) {
            const skuSupplier = supplierElement.textContent.trim();
            resultDiv.innerHTML = `
                <p><strong>${skuSupplier}</strong></p>
                <a href="${productUrl}" target="_blank" style="color: #4d78ff;">Перейти на товар</a>
            `;
        } else {
            resultDiv.innerHTML = '<p style="color: red;">Арт. партнёра не найден.</p>';
        }
    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = '<p style="color: red;">Ошибка при загрузке данных. Попробуйте позже.</p>';
    } finally {
        loading.style.display = 'none';
    }
});

async function fetchHTML(url) {
    const response = await fetch(proxyBase + encodeURIComponent(url));
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.text();
}

