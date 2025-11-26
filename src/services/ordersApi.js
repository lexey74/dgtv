/**
 * API сервис для получения статистики заказов
 */

// Конфигурация API
const API_CONFIG = {
  // Для production используйте реальный URL
  baseUrl: import.meta.env.VITE_API_URL || 'https://api-mock.your-domain.com/v1',
  token: import.meta.env.VITE_API_TOKEN || '',
  timeout: 10000 // 10 секунд
};

/**
 * Базовый fetch с обработкой ошибок и таймаутом
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Добавляем токен, если он есть
    if (API_CONFIG.token) {
      headers['Authorization'] = `Bearer ${API_CONFIG.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания запроса');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Получить статистику за сегодня
 * @param {string} clientId - ID клиента (yakitoriya, serviceguru, mkk)
 * @returns {Promise<Object>} Статистика за сегодня
 */
export async function getTodayOrders(clientId) {
  const url = `${API_CONFIG.baseUrl}/clients/${clientId}/orders/today`;
  return await fetchWithTimeout(url);
}

/**
 * Получить статистику за последние 30 дней
 * @param {string} clientId - ID клиента
 * @param {Object} options - Опции запроса
 * @param {number} options.days - Количество дней (по умолчанию 30)
 * @param {boolean} options.excludeToday - Исключить текущий день
 * @returns {Promise<Object>} Статистика за месяц
 */
export async function getMonthlyOrders(clientId, options = {}) {
  const params = new URLSearchParams({
    days: options.days || 30,
    exclude_today: options.excludeToday !== false ? 'true' : 'false'
  });

  const url = `${API_CONFIG.baseUrl}/clients/${clientId}/orders/monthly?${params}`;
  return await fetchWithTimeout(url);
}

/**
 * Получить общую статистику за все время
 * @param {string} clientId - ID клиента
 * @returns {Promise<Object>} Статистика за все время
 */
export async function getTotalOrders(clientId) {
  const url = `${API_CONFIG.baseUrl}/clients/${clientId}/orders/total`;
  return await fetchWithTimeout(url);
}

/**
 * Получить полную статистику для дашборда (комбинированный запрос)
 * @param {string} clientId - ID клиента
 * @returns {Promise<Object>} Полная статистика
 */
export async function getClientDashboard(clientId) {
  const url = `${API_CONFIG.baseUrl}/clients/${clientId}/orders/dashboard`;
  return await fetchWithTimeout(url);
}

/**
 * Получить список всех клиентов
 * @returns {Promise<Object>} Список клиентов
 */
export async function getClients() {
  const url = `${API_CONFIG.baseUrl}/clients`;
  return await fetchWithTimeout(url);
}

/**
 * Мок-функция для генерации тестовых данных (для разработки)
 * Возвращает данные в формате API
 */
export function generateMockData(clientId, clientName, color) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Генерируем случайное количество заказов за сегодня (800-2500)
  const todayOrders = Math.floor(Math.random() * 1700) + 800;
  
  // Генерируем данные за 30 дней
  const dailyOrders = [];
  let total = 0;
  
  for (let i = 29; i >= 0; i--) {
    const orders = Math.floor(Math.random() * 1500) + 900;
    dailyOrders.push(orders);
    total += orders;
  }
  
  // Общее количество заказов за все время (от 2М до 7М)
  const totalAllTime = Math.floor(Math.random() * 5000000) + 2000000;
  
  return {
    client_id: clientId,
    client_name: clientName,
    color: color,
    today: {
      date: todayStr,
      orders_count: todayOrders,
      period: {
        from: `${todayStr}T00:00:00Z`,
        to: new Date().toISOString()
      }
    },
    monthly: {
      period: {
        from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      daily_orders: dailyOrders,
      total: total,
      average: Math.round(total / 30 * 100) / 100
    },
    total: {
      orders_count: totalAllTime,
      since: '2020-01-01'
    },
    updated_at: new Date().toISOString(),
    next_update: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  };
}

/**
 * Получить данные с автоматическим переключением на мок-данные при ошибке
 * @param {string} clientId - ID клиента
 * @param {string} clientName - Название клиента (для мок-данных)
 * @param {string} color - Цвет клиента (для мок-данных)
 * @returns {Promise<Object>} Данные клиента
 */
export async function getClientDashboardSafe(clientId, clientName, color) {
  try {
    // Пытаемся получить реальные данные
    return await getClientDashboard(clientId);
  } catch (error) {
    console.warn(`Не удалось загрузить данные для ${clientId}, используем мок-данные:`, error.message);
    // Если API недоступен, возвращаем мок-данные
    return generateMockData(clientId, clientName, color);
  }
}

// Экспортируем конфигурацию для возможности изменения
export { API_CONFIG };
