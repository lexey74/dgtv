import { ref } from 'vue'
import { getClientDashboardSafe, getClientsList } from './ordersApi.js'
import { config } from '../config.js'

// Централизованное хранилище данных для всех клиентов
const clientsData = ref(new Map())
const clients = ref([]) // Теперь clients - реактивный массив, загружаемый с API
let updateInterval = null

// Функция загрузки списка клиентов с сервера
async function fetchClientsList() {
  console.log('📋 Загрузка списка клиентов с сервера...')
  
  try {
    const response = await getClientsList()
    clients.value = response.clients.filter(client => client.active)
    console.log(`✅ Загружено клиентов: ${clients.value.length}`)
    return clients.value
  } catch (error) {
    console.error('❌ Ошибка загрузки списка клиентов:', error)
    // Возвращаем пустой массив, чтобы не падало приложение
    clients.value = []
    return []
  }
}

// Функция загрузки данных для всех клиентов
async function fetchAllClientsData() {
  console.log('🔄 Загрузка данных для всех клиентов...', new Date().toLocaleTimeString())
  
  // Если список клиентов пустой, не делаем запросы
  if (clients.value.length === 0) {
    console.log('⚠️ Список клиентов пуст, пропускаем загрузку данных')
    return
  }
  
  const promises = clients.value.map(async (client) => {
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
export async function initDataStore() {
  console.log('🚀 Инициализация хранилища данных')
  console.log(`⏱️ Интервал обновления: ${config.apiRefreshInterval / 1000} секунд`)
  
  // Сначала загружаем список клиентов с сервера
  await fetchClientsList()
  
  // Затем загружаем данные для всех клиентов
  await fetchAllClientsData()
  
  // Периодическое обновление
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  updateInterval = setInterval(async () => {
    // Периодически обновляем список клиентов (могут добавиться новые)
    await fetchClientsList()
    // И данные для всех клиентов
    await fetchAllClientsData()
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
