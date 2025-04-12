// Функция для очистки и извлечения заказа из строки
// Используем регулярное выражение для поиска шаблона, который содержит буквы и цифры, возможно разделенные дефисом
function extractOrder(str) {
  // Регулярное выражение: ищет хотя бы 2 буквы, затем цифры, затем возможно дефис и цифры
  // Можно менять шаблон при необходимости
  const regex = /[A-Za-z]{2,}[0-9]+(?:-[0-9]+)?/;
  const match = str.match(regex);
  return match ? match[0] : null;
}

// Функция для обработки текста: разделение по разделителям, очистка и извлечение заказа
function processInput(text) {
  // Разбиваем по переводам строки, запятым, пробелам и символам табуляции
  let parts = text.split(/[\n,]+/);
  let orders = [];
  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed) {
      let order = extractOrder(trimmed);
      if (order) orders.push(order);
    }
  });
  return orders;
}

// Функция для нахождения уникальных заказов
// Определяем уникальные заказы как те, которые встречаются только один раз среди всех введённых
function getUniqueOrders(list1, list2) {
  const allOrders = [...list1, ...list2];
  const orderCount = {};
  allOrders.forEach(order => {
    orderCount[order] = (orderCount[order] || 0) + 1;
  });
  // Заказы, встречающиеся один раз
  return allOrders.filter(order => orderCount[order] === 1);
}

// Обработка клика на кнопку "Обработать заказы"
document.getElementById('processBtn').addEventListener('click', () => {
  const text1 = document.getElementById('input1').value;
  const text2 = document.getElementById('input2').value;

  const orders1 = processInput(text1);
  const orders2 = processInput(text2);

  const uniqueOrders = getUniqueOrders(orders1, orders2);

  // Выводим уникальные заказы через запятую
  document.getElementById('output').value = uniqueOrders.join(', ');
});

// Обработка копирования результатов
document.getElementById('copyBtn').addEventListener('click', () => {
  const outputElem = document.getElementById('output');
  outputElem.select();
  outputElem.setSelectionRange(0, 99999); // для мобильных устройств
  try {
    navigator.clipboard.writeText(outputElem.value).then(() => {
      alert('Уникальные заказы успешно скопированы в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать заказы. Попробуйте вручную.');
    });
  } catch (err) {
    // Если API не поддерживается
    document.execCommand('copy');
    alert('Уникальные заказы успешно скопированы в буфер обмена!');
  }
});
