import { ref } from 'vue'
import { getTodayOrders, getMonthlyOrders, getTotalOrders, getClientsList } from './ordersApi.js'
import { config } from '../config.js'

// Централизованное хранилище данных для всех клиентов
const clientsData = ref(new Map())
const clients = ref([]) // Реактивный массив клиентов, загружаемый с API
let todayInterval = null
let dailyUpdateTimeout = null

/**
 * Функция загрузки списка клиентов с сервера
 */
async function fetchClientsList() {
  console.log('📋 Загрузка списка клиентов с сервера...')
  
  try {
    const response = await getClientsList()
    clients.value = response.clients.filter(client => client.active)
    console.log(`✅ Загружено клиентов: ${clients.value.length}`)
    return clients.value
  } catch (error) {
    console.error('❌ Ошибка загрузки списка клиентов:', error)
    clients.value = []
    return []
  }
}

/**
 * Функция загрузки данных за сегодня для всех клиентов
 */
async function fetchTodayData() {
  console.log('🔄 Обновление данных за сегодня...', new Date().toLocaleTimeString())
  
  if (clients.value.length === 0) {
    console.log('⚠️ Список клиентов пуст, пропускаем загрузку данных')
    return
  }
  
  const promises = clients.value.map(async (client) => {
    try {
      const todayData = await getTodayOrders(client.id)
      
      // Получаем существующие данные клиента или создаем новый объект
      const existingData = clientsData.value.get(client.id) || {
        client_id: client.id,
        client_name: client.name,
        color: client.color,
        today: null,
        monthly: null,
        total: null,
        totalExcludingToday: 0 // Данные за все время без сегодняшнего дня
      }
      
      // Обновляем данные за сегодня
      existingData.today = todayData
      
      // Пересчитываем общее количество заказов: база (без сегодня) + сегодня
      if (existingData.totalExcludingToday > 0) {
        existingData.total = {
          ...existingData.total,
          orders_count: existingData.totalExcludingToday + todayData.orders_count
        }
      }
      
      clientsData.value.set(client.id, existingData)
      console.log(`✅ Данные за сегодня для ${client.name}: ${todayData.orders_count} заказов`)
    } catch (error) {
      console.error(`❌ Ошибка загрузки данных за сегодня для ${client.name}:`, error)
    }
  })
  
  await Promise.all(promises)
  console.log('✅ Обновление данных за сегодня завершено')
}

/**
 * Функция загрузки данных за месяц для всех клиентов
 */
async function fetchMonthlyData() {
  console.log('📅 Обновление данных за месяц...', new Date().toLocaleTimeString())
  
  if (clients.value.length === 0) {
    console.log('⚠️ Список клиентов пуст, пропускаем загрузку данных')
    return
  }
  
  const promises = clients.value.map(async (client) => {
    try {
      const monthlyData = await getMonthlyOrders(client.id)
      
      const existingData = clientsData.value.get(client.id) || {
        client_id: client.id,
        client_name: client.name,
        color: client.color,
        today: null,
        monthly: null,
        total: null,
        totalExcludingToday: 0
      }
      
      existingData.monthly = monthlyData
      clientsData.value.set(client.id, existingData)
      console.log(`✅ Данные за месяц для ${client.name} обновлены`)
    } catch (error) {
      console.error(`❌ Ошибка загрузки данных за месяц для ${client.name}:`, error)
    }
  })
  
  await Promise.all(promises)
  console.log('✅ Обновление данных за месяц завершено')
}

/**
 * Функция загрузки данных за все время (без текущей даты) для всех клиентов
 */
async function fetchTotalData() {
  console.log('🏆 Обновление данных за все время...', new Date().toLocaleTimeString())
  
  if (clients.value.length === 0) {
    console.log('⚠️ Список клиентов пуст, пропускаем загрузку данных')
    return
  }
  
  const promises = clients.value.map(async (client) => {
    try {
      const totalData = await getTotalOrders(client.id)
      
      const existingData = clientsData.value.get(client.id) || {
        client_id: client.id,
        client_name: client.name,
        color: client.color,
        today: null,
        monthly: null,
        total: null,
        totalExcludingToday: 0
      }
      
      // Сохраняем базовое значение (без сегодняшнего дня)
      existingData.totalExcludingToday = totalData.orders_count
      existingData.total = totalData
      
      // Если есть данные за сегодня, добавляем их к общему количеству
      if (existingData.today && existingData.today.orders_count) {
        existingData.total.orders_count = existingData.totalExcludingToday + existingData.today.orders_count
      }
      
      clientsData.value.set(client.id, existingData)
      console.log(`✅ Данные за все время для ${client.name}: ${existingData.total.orders_count} заказов`)
    } catch (error) {
      console.error(`❌ Ошибка загрузки данных за все время для ${client.name}:`, error)
    }
  })
  
  await Promise.all(promises)
  console.log('✅ Обновление данных за все время завершено')
}

/**
 * Вычисление времени до следующего ежедневного обновления (00:01)
 */
function getTimeUntilDailyUpdate() {
  const now = new Date()
  const [hours, minutes] = config.dailyUpdateTime.split(':').map(Number)
  
  const nextUpdate = new Date()
  nextUpdate.setHours(hours, minutes, 0, 0)
  
  // Если время уже прошло сегодня, планируем на завтра
  if (nextUpdate <= now) {
    nextUpdate.setDate(nextUpdate.getDate() + 1)
  }
  
  return nextUpdate.getTime() - now.getTime()
}

/**
 * Планирование ежедневного обновления в 00:01
 */
function scheduleDailyUpdate() {
  const timeUntil = getTimeUntilDailyUpdate()
  console.log(`⏰ Следующее ежедневное обновление через ${Math.round(timeUntil / 1000 / 60)} минут`)
  
  if (dailyUpdateTimeout) {
    clearTimeout(dailyUpdateTimeout)
  }
  
  dailyUpdateTimeout = setTimeout(async () => {
    console.log('🌅 Выполнение ежедневного обновления...')
    
    // Обновляем данные за месяц и за все время
    await Promise.all([
      fetchMonthlyData(),
      fetchTotalData()
    ])
    
    // Планируем следующее обновление
    scheduleDailyUpdate()
  }, timeUntil)
}

/**
 * Получение данных клиента из кеша
 */
export function getClientData(clientId) {
  return clientsData.value.get(clientId)
}

/**
 * Инициализация автоматического обновления данных
 */
export async function initDataStore() {
  console.log('🚀 Инициализация хранилища данных')
  console.log(`⏱️ Интервал обновления данных за сегодня: ${config.todayRefreshInterval / 1000} секунд`)
  console.log(`⏱️ Ежедневное обновление данных в: ${config.dailyUpdateTime}`)
  
  // 1. Загружаем список клиентов с сервера
  await fetchClientsList()
  
  // 2. Загружаем все данные при старте
  await Promise.all([
    fetchTodayData(),      // Данные за сегодня
    fetchMonthlyData(),    // Данные за месяц
    fetchTotalData()       // Данные за все время (без текущей даты)
  ])
  
  // 3. Настраиваем периодическое обновление данных за сегодня (каждые 10 минут)
  if (todayInterval) {
    clearInterval(todayInterval)
  }
  
  todayInterval = setInterval(async () => {
    // Периодически обновляем список клиентов (могут добавиться новые)
    await fetchClientsList()
    // Обновляем только данные за сегодня
    await fetchTodayData()
  }, config.todayRefreshInterval)
  
  // 4. Планируем ежедневное обновление в 00:01
  scheduleDailyUpdate()
}

/**
 * Остановка обновлений (для очистки при размонтировании)
 */
export function stopDataStore() {
  if (todayInterval) {
    clearInterval(todayInterval)
    todayInterval = null
  }
  
  if (dailyUpdateTimeout) {
    clearTimeout(dailyUpdateTimeout)
    dailyUpdateTimeout = null
  }
  
  console.log('🛑 Обновление данных остановлено')
}

// Экспорт списка клиентов
export { clients }
