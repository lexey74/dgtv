<template>
  <div class="dashboard">
    <!-- Main grid with 6 company cards (2 rows x 3 columns) -->
    <div class="cards-grid">
      <TransitionGroup name="slide">
        <DashboardCard
          v-for="client in visibleClients"
          :key="client.id"
          :client-id="client.id"
          :client-name="client.name"
          :color="client.color"
        />
      </TransitionGroup>
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
  
  for (let i = 0; i < config.visibleCards; i++) {
    const index = (start + i) % clients.length
    result.push(clients[index])
  }
  
  return result
})

// Функция переключения на следующие карточки
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + config.visibleCards) % clients.length
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
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  padding: 2rem;
  background: #0a0a0f;
  overflow: hidden;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Анимация слайдов */
.slide-move,
.slide-enter-active,
.slide-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-leave-active {
  position: absolute;
  width: calc((100% - 3rem) / 3);
  height: calc((100% - 1.5rem) / 2);
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
