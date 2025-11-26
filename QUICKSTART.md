# Быстрый старт - Интеграция API

## ✅ Что было сделано

### Переработанные карточки клиентов
Каждая карточка теперь отображает:
1. **Название клиента** (Якитория, ServiceGuru, МКК)
2. **СЕГОДНЯ** - количество заказов с 00:00 до текущей минуты
3. **ЗА МЕСЯЦ** - график заказов за последние 30 дней (без сегодня)
4. **ЗА ВСЕ ВРЕМЯ** - общее количество заказов

### Автообновление
- Данные обновляются **каждые 10 минут**
- Первая загрузка при открытии страницы
- Автоматический fallback на мок-данные при ошибках

---

## 🚀 Запуск для проверки

```bash
cd dgtv
npm run dev
```

Откройте: http://10.10.10.90:5173

---

## 🔌 API Endpoint

### Основной endpoint (рекомендуется)

```http
GET /clients/{client_id}/orders/dashboard
Authorization: Bearer {token}
```

### Параметры
- `client_id`: `yakitoriya` | `serviceguru` | `mkk`

### Пример ответа

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
    "daily_orders": [1200, 1500, 1300, 1700, 1400, 1800, 1600, 1920, ...],
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

### Важные поля

| Поле | Тип | Описание |
|------|-----|----------|
| `today.orders_count` | number | Заказов с 00:00 до сейчас |
| `monthly.daily_orders` | number[] | Массив из 30 чисел (заказы по дням) |
| `total.orders_count` | number | Всего заказов за все время |

---

## ⚙️ Настройка подключения

### 1. Создайте `.env.local`

```bash
VITE_API_URL=https://your-api-domain.com/v1
VITE_API_TOKEN=your_bearer_token_here
```

### 2. Перезапустите сервер

```bash
npm run dev
```

### 3. Проверьте консоль браузера

Должны появиться логи:
```
✅ Данные для Якитория обновлены: { сегодня: 1920, месяц: '30 дней', всего: 4993238 }
🔄 Автообновление для Якитория запущено (каждые 10 минут)
```

---

## 🧪 Тестирование API

### С помощью curl

```bash
# Тест endpoint для Якитория
curl -X GET "https://your-api-domain.com/v1/clients/yakitoriya/orders/dashboard" \
  -H "Authorization: Bearer your_token"

# Тест для ServiceGuru
curl -X GET "https://your-api-domain.com/v1/clients/serviceguru/orders/dashboard" \
  -H "Authorization: Bearer your_token"

# Тест для МКК
curl -X GET "https://your-api-domain.com/v1/clients/mkk/orders/dashboard" \
  -H "Authorization: Bearer your_token"
```

### С помощью Postman

1. Создайте GET запрос
2. URL: `https://your-api-domain.com/v1/clients/yakitoriya/orders/dashboard`
3. Headers: `Authorization: Bearer your_token`
4. Send

---

## 📊 Пример backend реализации

### Node.js + Express

```javascript
const express = require('express');
const app = express();

app.get('/v1/clients/:clientId/orders/dashboard', async (req, res) => {
  const { clientId } = req.params;
  
  // Проверка токена
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Получение данных из БД
  const today = await getOrdersToday(clientId);
  const monthly = await getOrdersMonthly(clientId, 30);
  const total = await getOrdersTotal(clientId);
  
  // Формирование ответа
  res.json({
    client_id: clientId,
    client_name: getClientName(clientId),
    color: getClientColor(clientId),
    today: {
      date: new Date().toISOString().split('T')[0],
      orders_count: today.count,
      period: {
        from: `${today.date}T00:00:00Z`,
        to: new Date().toISOString()
      }
    },
    monthly: {
      period: {
        from: monthly.startDate,
        to: monthly.endDate
      },
      daily_orders: monthly.dailyCounts, // массив из 30 чисел
      total: monthly.total,
      average: monthly.average
    },
    total: {
      orders_count: total.count,
      since: total.firstOrderDate
    },
    updated_at: new Date().toISOString(),
    next_update: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
});

app.listen(3000);
```

### Python + FastAPI

```python
from fastapi import FastAPI, Header, HTTPException
from datetime import datetime, timedelta
from typing import List

app = FastAPI()

@app.get("/v1/clients/{client_id}/orders/dashboard")
async def get_dashboard(
    client_id: str,
    authorization: str = Header(None)
):
    # Проверка токена
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.replace("Bearer ", "")
    if token != os.getenv("API_TOKEN"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Получение данных
    today = get_orders_today(client_id)
    monthly = get_orders_monthly(client_id, days=30)
    total = get_orders_total(client_id)
    
    return {
        "client_id": client_id,
        "client_name": get_client_name(client_id),
        "color": get_client_color(client_id),
        "today": {
            "date": datetime.now().date().isoformat(),
            "orders_count": today["count"],
            "period": {
                "from": f"{datetime.now().date()}T00:00:00Z",
                "to": datetime.now().isoformat()
            }
        },
        "monthly": {
            "period": {
                "from": monthly["start_date"],
                "to": monthly["end_date"]
            },
            "daily_orders": monthly["daily_counts"],  # список из 30 чисел
            "total": monthly["total"],
            "average": monthly["average"]
        },
        "total": {
            "orders_count": total["count"],
            "since": total["first_order_date"]
        },
        "updated_at": datetime.now().isoformat(),
        "next_update": (datetime.now() + timedelta(minutes=10)).isoformat()
    }
```

---

## 🔍 Проверка работы

### 1. В браузере откройте DevTools (F12)
### 2. Перейдите на вкладку Console
### 3. Должны увидеть логи:

```
✅ Данные для Якитория обновлены: {сегодня: 1920, месяц: "30 дней", всего: 4993238}
✅ Данные для ServiceGuru обновлены: {сегодня: 1261, месяц: "30 дней", всего: 594582}
✅ Данные для МКК обновлены: {сегодня: 845, месяц: "30 дней", всего: 497382}
🔄 Автообновление для Якитория запущено (каждые 10 минут)
🔄 Автообновление для ServiceGuru запущено (каждые 10 минут)
🔄 Автообновление для МКК запущено (каждые 10 минут)
```

### 4. Проверьте вкладку Network
- Должны быть запросы к `/clients/yakitoriya/orders/dashboard`
- Должны быть запросы к `/clients/serviceguru/orders/dashboard`
- Должны быть запросы к `/clients/mkk/orders/dashboard`

---

## 📝 Чеклист интеграции

- [ ] API endpoint создан и работает
- [ ] Возвращает корректный JSON
- [ ] CORS настроен для TV-бокса
- [ ] Токен аутентификации установлен
- [ ] `.env.local` создан с правильными значениями
- [ ] Dev-сервер перезапущен после изменения .env
- [ ] В консоли видны логи обновления
- [ ] Данные отображаются на карточках
- [ ] График рисуется корректно
- [ ] Через 10 минут данные обновляются автоматически

---

## 🆘 Если что-то не работает

### API недоступен
✅ **Решение:** Приложение автоматически переключится на мок-данные

### Ошибка CORS
```
Access to fetch at 'https://api.domain.com' from origin 'http://10.10.10.90:5173' 
has been blocked by CORS policy
```
✅ **Решение:** Добавьте в backend:
```javascript
app.use(cors({
  origin: ['http://10.10.10.90:5173', 'http://localhost:5173'],
  credentials: true
}));
```

### 401 Unauthorized
✅ **Решение:** Проверьте токен в `.env.local` и на backend

### График не отображается
✅ **Решение:** Убедитесь, что `monthly.daily_orders` содержит ровно 30 чисел

---

## 📚 Дополнительная документация

- `API_SPECIFICATION.md` - Полная спецификация API
- `INTEGRATION_GUIDE.md` - Детальное руководство по интеграции
- `README.md` - Общая документация проекта

---

## 🎉 Готово!

Приложение работает с мок-данными из коробки. Для подключения к реальному API просто:

1. Настройте `.env.local`
2. Перезапустите `npm run dev`
3. Проверьте консоль браузера

При любых проблемах с API приложение автоматически вернется к мок-данным.
