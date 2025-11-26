<template>
  <div class="dashboard-card" :style="{ borderColor: color }">
    <div class="card-header">
      <h2 class="title">{{ clientName }}</h2>
    </div>

    <div class="stats-section today">
      <div class="stat-label">СЕГОДНЯ</div>
      <div class="stat-value main">{{ formatNumber(todayOrders) }}</div>
      <div class="loading-indicator" v-if="loading">обновление...</div>
    </div>

    <div class="chart-section">
      <div class="chart-label">ЗА МЕСЯЦ</div>
      <div class="chart-container">
        <svg class="chart" :viewBox="`-20 0 ${chartWidth + 40} ${chartHeight + 40}`" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient :id="`gradient-${clientId}`" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :style="`stop-color:${color};stop-opacity:0.8`" />
              <stop offset="100%" :style="`stop-color:${color};stop-opacity:0.2`" />
            </linearGradient>
          </defs>
          
          <!-- Вертикальные линии каждые 7 дней -->
          <g v-for="(date, index) in gridDates" :key="index">
            <line
              :x1="date.x"
              :y1="0"
              :x2="date.x"
              :y2="chartHeight"
              stroke="rgba(255, 255, 255, 0.1)"
              stroke-width="1"
              stroke-dasharray="4,4"
            />
            <text
              :x="date.adjustedX"
              :y="chartHeight + 18"
              text-anchor="middle"
              fill="rgba(255, 255, 255, 0.5)"
              font-size="13"
              font-family="system-ui, -apple-system, sans-serif"
            >
              {{ date.label }}
            </text>
          </g>
          
          <!-- Горизонтальные линии для max и min значений -->
          <g v-for="(line, index) in horizontalLines" :key="`h-${index}`">
            <line
              :x1="0"
              :y1="line.y"
              :x2="chartWidth"
              :y2="line.y"
              stroke="rgba(255, 255, 255, 0.1)"
              stroke-width="1"
              stroke-dasharray="4,4"
            />
            <text
              :x="-10"
              :y="line.y + (index === 0 ? -20 : -10)"
              text-anchor="end"
              dominant-baseline="middle"
              fill="rgba(255, 255, 255, 0.5)"
              font-size="11"
              font-family="system-ui, -apple-system, sans-serif"
              :transform="`rotate(-90, -10, ${line.y + (index === 0 ? -20 : -10)})`"
            >
              {{ line.label }}
            </text>
          </g>
          
          <!-- График с заливкой -->
          <path
            :d="chartPath"
            :fill="`url(#gradient-${clientId})`"
            :stroke="color"
            stroke-width="2"
          />
        </svg>
      </div>
    </div>

    <div class="stats-section total">
      <div class="stat-label">ЗА ВСЕ ВРЕМЯ</div>
      <div class="stat-value">{{ formatNumber(totalOrders) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getClientData } from '../services/dataStore.js'

const props = defineProps({
  clientId: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
})

// Состояние компонента
const loading = ref(false)
const todayOrders = ref(0)
const monthlyData = ref([])
const totalOrders = ref(0)
const startDate = ref(null)

// Размеры графика (компактные для 2х рядов)
const chartWidth = 350
const chartHeight = 180

/**
 * Форматирование чисел с пробелами (1920 -> 1 920)
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Форматирование даты в формат DD.MM
 */
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

/**
 * Вычисление дат для вертикальных линий (каждые 7 дней)
 */
const gridDates = computed(() => {
  if (!startDate.value || !monthlyData.value || monthlyData.value.length === 0) {
    return []
  }
  
  const dates = []
  const step = chartWidth / (monthlyData.value.length - 1)
  const textOffset = 10 // Отступ для крайних дат (примерно половина ширины текста)
  
  // Добавляем линии на 0, 7, 14, 21, 28 день
  for (let i = 0; i < 30; i += 7) {
    if (i < monthlyData.value.length) {
      const date = new Date(startDate.value)
      date.setDate(date.getDate() + i)
      
      const x = i * step
      let adjustedX = x
      
      // Сдвигаем первую дату вправо
      if (i === 0) {
        adjustedX = x + textOffset
      }
      // Сдвигаем последнюю дату влево
      else if (i === 28) {
        adjustedX = x - textOffset
      }
      
      dates.push({
        x: x, // Позиция линии остается на месте
        adjustedX: adjustedX, // Позиция текста сдвигается
        label: formatDate(date)
      })
    }
  }
  
  return dates
})

/**
 * Вычисление горизонтальных линий для max и min значений
 */
const horizontalLines = computed(() => {
  if (!monthlyData.value || monthlyData.value.length === 0) {
    return []
  }
  
  const points = monthlyData.value
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  
  // Вычисляем Y координаты для max и min
  const yMax = chartHeight - ((max - min) / range) * (chartHeight - 20)
  const yMin = chartHeight - ((min - min) / range) * (chartHeight - 20)
  
  return [
    {
      y: yMax,
      value: max,
      label: formatNumber(max)
    },
    {
      y: yMin,
      value: min,
      label: formatNumber(min)
    }
  ]
})

/**
 * Генерация пути для SVG графика
 */
const chartPath = computed(() => {
  if (!monthlyData.value || monthlyData.value.length === 0) {
    // Возвращаем плоскую линию по умолчанию
    return `M 0 ${chartHeight} L 0 ${chartHeight / 2} L ${chartWidth} ${chartHeight / 2} L ${chartWidth} ${chartHeight} Z`
  }
  
  const points = monthlyData.value
  const step = chartWidth / (points.length - 1)
  
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  
  let path = `M 0 ${chartHeight}`
  
  points.forEach((value, index) => {
    const x = index * step
    const y = chartHeight - ((value - min) / range) * (chartHeight - 20)
    
    if (index === 0) {
      path += ` L 0 ${y}`
    } else {
      path += ` L ${x} ${y}`
    }
  })
  
  path += ` L ${chartWidth} ${chartHeight} Z`
  
  return path
})

/**
 * Обновление данных из централизованного хранилища
 */
const updateFromCache = () => {
  const data = getClientData(props.clientId)
  
  if (data) {
    todayOrders.value = data.today.orders_count
    monthlyData.value = data.monthly.daily_orders
    totalOrders.value = data.total.orders_count
    
    // Сохраняем дату начала периода (30 дней назад)
    const fromDate = data.monthly.period?.from
    if (fromDate) {
      startDate.value = new Date(fromDate)
    } else {
      // Если дата не пришла, вычисляем 30 дней назад
      const date = new Date()
      date.setDate(date.getDate() - 30)
      startDate.value = date
    }
  }
}

/**
 * Следим за изменениями clientId - когда карусель меняет карточки,
 * сразу подгружаем данные из кеша
 */
watch(
  () => props.clientId,
  () => {
    updateFromCache()
  },
  { immediate: true }
)
</script>

<style scoped>
.dashboard-card {
  background: rgba(30, 30, 35, 0.95);
  border-radius: 8px;
  padding: 0.6rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border: 2px solid;
  border-color: rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  overflow: hidden;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

.stats-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.2rem 0;
}

.stats-section.today {
  padding: 0.25rem 0;
}

.stats-section.total {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.3rem;
}

.stat-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.2rem;
  font-weight: 600;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.stat-value.main {
  font-size: 1.6rem;
  line-height: 1;
}

.loading-indicator {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.chart-section {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.2rem 0;
  flex: 1;
  min-height: 0;
}

.chart-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  font-weight: 600;
}

.chart-container {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 150px;
  margin: 0 -0.3rem;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 150px;
  max-height: 280px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
}
</style>
