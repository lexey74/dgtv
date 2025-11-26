<template>
  <div class="dashboard">
    <!-- Main grid with 6 company cards (2 rows x 3 columns) -->
    <div class="cards-grid">
      <Transition name="fade" mode="out-in">
        <div :key="currentIndex" class="cards-container">
          <DashboardCard
            v-for="client in visibleClients"
            :key="client.id"
            :client-id="client.id"
            :client-name="client.name"
            :color="client.color"
          />
        </div>
      </Transition>
    </div>

    <!-- Right sidebar with widgets -->
    <div class="sidebar">
      <Clock />
      <Weather />
      <Birthdays />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardCard from '../components/DashboardCard.vue'
import Clock from '../components/Clock.vue'
import Weather from '../components/Weather.vue'
import Birthdays from '../components/Birthdays.vue'
import { clients, initDataStore, stopDataStore } from '../services/dataStore.js'
import { config } from '../config.js'

// Текущий индекс начала отображаемых карточек
const currentIndex = ref(0)
const carouselInterval = ref(null)

// Вычисляем видимые карточки
const visibleClients = computed(() => {
  const start = currentIndex.value
  const result = []
  
  // Проверяем что список клиентов загружен
  if (!clients.value || clients.value.length === 0) {
    return []
  }
  
  for (let i = 0; i < config.visibleCards; i++) {
    const index = (start + i) % clients.value.length
    result.push(clients.value[index])
  }
  
  return result
})

// Функция переключения на следующие карточки
const nextSlide = () => {
  if (!clients.value || clients.value.length === 0) {
    return
  }
  
  currentIndex.value = (currentIndex.value + config.visibleCards) % clients.value.length
  console.log(`🔄 Карусель: показываем клиентов ${currentIndex.value}-${currentIndex.value + config.visibleCards - 1}`)
}

// Запуск карусели и системы данных
onMounted(() => {
  // Инициализация централизованного хранилища данных
  initDataStore()
  
  // Запуск карусели
  carouselInterval.value = setInterval(nextSlide, config.carouselInterval)
  console.log(`🎠 Карусель карточек запущена (переключение каждые ${config.carouselInterval / 1000} секунд)`)
})

// Остановка карусели и обновлений
onUnmounted(() => {
  if (carouselInterval.value) {
    clearInterval(carouselInterval.value)
    console.log('⏹️ Карусель карточек остановлена')
  }
  
  // Остановка обновления данных
  stopDataStore()
})
</script>

<style scoped>
.dashboard {
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1rem;
  padding: 1rem;
  background: #0a0a0f;
  overflow: hidden;
  box-sizing: border-box;
}

.cards-grid {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1rem;
  height: 100%;
}

/* Анимация fade для всех 6 карточек одновременно */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem 0;
  overflow-y: auto;
}

/* Scrollbar styling */
.cards-grid::-webkit-scrollbar,
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.cards-grid::-webkit-scrollbar-track,
.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.cards-grid::-webkit-scrollbar-thumb,
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.cards-grid::-webkit-scrollbar-thumb:hover,
.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive adjustments for smaller TV screens */
@media (max-width: 1600px) {
  .dashboard {
    grid-template-columns: 1fr 350px;
  }
  
  .cards-grid {
    gap: 1.5rem;
  }
}

@media (max-width: 1366px) {
  .dashboard {
    grid-template-columns: 1fr 300px;
  }
}
</style>
