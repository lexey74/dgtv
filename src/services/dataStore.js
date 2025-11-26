import { ref } from 'vue'
import { getClientDashboardSafe } from './ordersApi.js'
import { config } from '../config.js'

// Централизованное хранилище данных для всех клиентов
const clientsData = ref(new Map())
let updateInterval = null

// Список всех клиентов
const clients = [
  { id: 'yakitoriya', name: 'Якитория', color: '#dc2626' },
  { id: 'serviceguru', name: 'ServiceGuru', color: '#22c55e' },
  { id: 'mkk', name: 'МКК', color: '#3b82f6' },
  { id: 'eggselent', name: 'Eggselent', color: '#a855f7' },
  { id: 'wasabi', range: 'Wasabi', color: '#06b6d4' },
  { id: 'menza', name: 'Menza', color: '#f59e0b' },
  { id: 'bakinsky', name: 'Бакинский бульвар', color: '#ef4444' },
  { id: 'zharpizza', name: 'Жар Пицца', color: '#10b981' },
  { id: 'barankin', name: 'Баранкин', color: '#8b5cf6' },
  { id: 'ligashashlikov', name: 'Лига Шашлыков', color: '#f97316' }
]

// Функция загрузки данных для всех клиентов
async function fetchAllClientsData() {
  console.log('🔄 Загрузка данных для всех клиентов...', new Date().toLocaleTimeString())
  
  const promises = clients.map(async (client) => {
    try {
      const data = await getClientDashboardSafe(client.id, client.name, client.color)
      clientsData.value.set(client.id, data)
      console.log(`✅ Данные для ${client.name} загружены`)
    } catch (error) {
      console.error(`❌ Ошибка загрузки данных для ${client.name}:`, error)
    }
  })
  
  await Promise.all(promises)
  console.log('✅ Все данные загружены')
}

// Получение данных клиента из кеша
export function getClientData(clientId) {
  return clientsData.value.get(clientId)
}

// Инициализация автоматического обновления данных
export function initDataStore() {
  console.log('🚀 Инициализация хранилища данных')
  console.log(`⏱️ Интервал обновления: ${config.apiRefreshInterval / 1000} секунд`)
  
  // Первоначальная загрузка
  fetchAllClientsData()
  
  // Периодическое обновление
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  updateInterval = setInterval(() => {
    fetchAllClientsData()
  }, config.apiRefreshInterval)
}

// Остановка обновлений (для очистки при размонтировании)
export function stopDataStore() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
    console.log('🛑 Обновление данных остановлено')
  }
}

// Экспорт списка клиентов
export { clients }
