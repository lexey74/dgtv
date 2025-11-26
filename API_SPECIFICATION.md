# API Спецификация для системы DGTV

## Базовый URL
```
https://api.your-domain.com/v1
```

## Аутентификация
Все запросы требуют Bearer токен в заголовке:
```
Authorization: Bearer {your_api_token}
```

---

## Endpoints

### 1. Получить статистику за сегодня
```http
GET /clients/{client_id}/orders/today
```

**Параметры:**
- `client_id` (string) - Уникальный идентификатор клиента (yakitoriya, serviceguru, mkk)

**Response:**
```json
{
  "client_id": "yakitoriya",
  "client_name": "Якитория",
  "date": "2025-11-26",
  "current_time": "2025-11-26T14:30:00Z",
  "orders_count": 1920,
  "period": {
    "from": "2025-11-26T00:00:00Z",
    "to": "2025-11-26T14:30:00Z"
  },
  "updated_at": "2025-11-26T14:30:00Z"
}
```

**Коды ответа:**
- `200 OK` - Успешно
- `404 Not Found` - Клиент не найден
- `401 Unauthorized` - Неверный токен
- `500 Internal Server Error` - Ошибка сервера

---

### 2. Получить статистику за последние 30 дней
```http
GET /clients/{client_id}/orders/monthly
```

**Параметры:**
- `client_id` (string) - Уникальный идентификатор клиента
- `days` (integer, optional) - Количество дней (по умолчанию 30)
- `exclude_today` (boolean, optional) - Исключить текущий день (по умолчанию true)

**Response:**
```json
{
  "client_id": "yakitoriya",
  "client_name": "Якитория",
  "period": {
    "from": "2025-10-27",
    "to": "2025-11-25"
  },
  "total_days": 30,
  "daily_stats": [
    {
      "date": "2025-10-27",
      "orders_count": 1200,
      "day_of_week": "Monday"
    },
    {
      "date": "2025-10-28",
      "orders_count": 1500,
      "day_of_week": "Tuesday"
    },
    // ... еще 28 дней
    {
      "date": "2025-11-25",
      "orders_count": 1920,
      "day_of_week": "Monday"
    }
  ],
  "summary": {
    "total_orders": 45230,
    "average_per_day": 1507.67,
    "max_day": {
      "date": "2025-11-15",
      "orders_count": 2100
    },
    "min_day": {
      "date": "2025-11-03",
      "orders_count": 890
    }
  },
  "updated_at": "2025-11-26T14:30:00Z"
}
```

**Коды ответа:**
- `200 OK` - Успешно
- `400 Bad Request` - Неверные параметры
- `404 Not Found` - Клиент не найден
- `401 Unauthorized` - Неверный токен

---

### 3. Получить общую статистику за все время
```http
GET /clients/{client_id}/orders/total
```

**Параметры:**
- `client_id` (string) - Уникальный идентификатор клиента

**Response:**
```json
{
  "client_id": "yakitoriya",
  "client_name": "Якитория",
  "period": {
    "from": "2020-01-01",
    "to": "2025-11-26"
  },
  "total_orders": 4993238,
  "total_days": 2156,
  "average_per_day": 2315.82,
  "milestones": [
    {
      "orders": 1000000,
      "reached_at": "2021-06-15"
    },
    {
      "orders": 2000000,
      "reached_at": "2022-08-20"
    }
  ],
  "updated_at": "2025-11-26T14:30:00Z"
}
```

**Коды ответа:**
- `200 OK` - Успешно
- `404 Not Found` - Клиент не найден
- `401 Unauthorized` - Неверный токен

---

### 4. Получить полную статистику клиента (комбинированный endpoint)
```http
GET /clients/{client_id}/orders/dashboard
```

**Параметры:**
- `client_id` (string) - Уникальный идентификатор клиента

**Response:**
```json
{
  "client_id": "yakitoriya",
  "client_name": "Якитория",
  "color": "#dc2626",
  "today": {
    "date": "2025-11-26",
    "orders_count": 1920,
    "period": {
      "from": "2025-11-26T00:00:00Z",
      "to": "2025-11-26T14:30:00Z"
    }
  },
  "monthly": {
    "period": {
      "from": "2025-10-27",
      "to": "2025-11-25"
    },
    "daily_orders": [1200, 1500, 1300, 1700, 1400, 1800, 1600, 1920, ...], // 30 значений
    "total": 45230,
    "average": 1507.67
  },
  "total": {
    "orders_count": 4993238,
    "since": "2020-01-01"
  },
  "updated_at": "2025-11-26T14:30:00Z",
  "next_update": "2025-11-26T14:40:00Z"
}
```

**Преимущества:**
- Один запрос вместо трёх
- Меньше нагрузка на сеть
- Быстрее загрузка дашборда

**Коды ответа:**
- `200 OK` - Успешно
- `404 Not Found` - Клиент не найден
- `401 Unauthorized` - Неверный токен

---

### 5. Получить список всех клиентов
```http
GET /clients
```

**Response:**
```json
{
  "clients": [
    {
      "id": "yakitoriya",
      "name": "Якитория",
      "color": "#dc2626",
      "active": true
    },
    {
      "id": "serviceguru",
      "name": "ServiceGuru",
      "color": "#22c55e",
      "active": true
    },
    {
      "id": "mkk",
      "name": "МКК",
      "color": "#f59e0b",
      "active": true
    }
  ],
  "total": 3
}
```

---

## Рекомендации по реализации

### Кэширование
- Кэшировать ответы на 10 минут для `/today`
- Кэшировать ответы на 1 час для `/monthly`
- Кэшировать ответы на 24 часа для `/total`

### Rate Limiting
- 100 запросов в минуту на клиента
- 1000 запросов в час на клиента

### Webhook (опционально)
```http
POST /webhooks/orders
```
Отправка уведомлений при обновлении статистики:
```json
{
  "event": "orders.updated",
  "client_id": "yakitoriya",
  "timestamp": "2025-11-26T14:30:00Z",
  "data": {
    "today_orders": 1920,
    "change": "+15"
  }
}
```

---

## Примеры использования

### JavaScript (Fetch API)
```javascript
const API_BASE = 'https://api.your-domain.com/v1';
const API_TOKEN = 'your_bearer_token';

async function getClientDashboard(clientId) {
  const response = await fetch(`${API_BASE}/clients/${clientId}/orders/dashboard`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Использование
try {
  const data = await getClientDashboard('yakitoriya');
  console.log('Сегодня:', data.today.orders_count);
  console.log('За месяц:', data.monthly.daily_orders);
  console.log('Всего:', data.total.orders_count);
} catch (error) {
  console.error('Ошибка загрузки:', error);
}
```

### cURL
```bash
# Получить статистику за сегодня
curl -X GET "https://api.your-domain.com/v1/clients/yakitoriya/orders/today" \
  -H "Authorization: Bearer your_token"

# Получить полную статистику для дашборда
curl -X GET "https://api.your-domain.com/v1/clients/yakitoriya/orders/dashboard" \
  -H "Authorization: Bearer your_token"
```

---

## Мок-данные для разработки

Для разработки можно использовать мок-сервер:
```
https://api-mock.your-domain.com/v1
```

Не требует аутентификации, возвращает тестовые данные.
