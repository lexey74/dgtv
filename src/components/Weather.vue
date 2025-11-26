<template>
  <div class="weather-widget">
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="weatherData.length > 0" class="weather-items">
      <div v-for="(item, index) in weatherData" :key="index" class="weather-item">
        <div class="temperature" :class="{ positive: item.temp > 0, negative: item.temp < 0 }">
          {{ item.temp > 0 ? '+' : '' }}{{ item.temp }}°
        </div>
        <div class="weather-icon">
          <img :src="getWeatherIconPath(item.icon)" :alt="item.icon" class="weather-svg" />
        </div>
        <div v-if="item.time" class="time-label">{{ item.time }}</div>
      </div>
    </div>
    <div v-else class="loading">Нет данных</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const weatherData = ref([])
const loading = ref(true)
const error = ref(null)

// Функция для определения иконки по описанию погоды
const getWeatherIcon = (description) => {
  const desc = description.toLowerCase()
  if (desc.includes('ясно') || desc.includes('солнечно')) return 'clear'
  if (desc.includes('дождь') || desc.includes('ливень')) return 'rain'
  if (desc.includes('снег')) return 'snow'
  if (desc.includes('облачно') || desc.includes('пасмурно')) return 'cloudy'
  return 'cloudy'
}

// Получение погоды через API прокси (так как Gismeteo требует авторизацию)
const fetchWeather = async () => {
  try {
    console.log('🌤️ Fetching weather data...')
    loading.value = true
    error.value = null
    
    // Используем Open-Meteo API (бесплатный аналог, не требует ключа)
    // Координаты Москвы: 55.7558, 37.6173
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=Europe/Moscow&forecast_days=2'
    )
    
    console.log('🌤️ Weather API response status:', response.status)
    
    if (!response.ok) {
      throw new Error('Не удалось получить данные о погоде')
    }
    
    const data = await response.json()
    
    console.log('🌤️ Weather API response:', data)
    
    // Текущая погода
    const current = {
      temp: Math.round(data.current.temperature_2m),
      icon: getWeatherIconFromCode(data.current.weather_code),
      time: 'Сейчас'
    }
    
    // Погода через 3 и 6 часов (с проверкой границ массива)
    const now = new Date()
    const currentHour = now.getHours()
    const maxIndex = data.hourly.temperature_2m.length - 1
    
    const index3h = Math.min(currentHour + 3, maxIndex)
    const index6h = Math.min(currentHour + 6, maxIndex)
    
    // Вычисляем время через 3 и 6 часов
    const time3h = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    const time6h = new Date(now.getTime() + 6 * 60 * 60 * 1000)
    
    const formatTime = (date) => {
      return `${String(date.getHours()).padStart(2, '0')}:00`
    }
    
    const forecast1 = {
      temp: Math.round(data.hourly.temperature_2m[index3h] || data.current.temperature_2m),
      icon: getWeatherIconFromCode(data.hourly.weather_code[index3h] || data.current.weather_code),
      time: formatTime(time3h)
    }
    
    const forecast2 = {
      temp: Math.round(data.hourly.temperature_2m[index6h] || data.current.temperature_2m),
      icon: getWeatherIconFromCode(data.hourly.weather_code[index6h] || data.current.weather_code),
      time: formatTime(time6h)
    }
    
    console.log('Weather data prepared:', [current, forecast1, forecast2])
    weatherData.value = [current, forecast1, forecast2]
    
  } catch (err) {
    console.error('Ошибка загрузки погоды:', err)
    error.value = 'Не удалось загрузить погоду'
    // Показываем фейковые данные в случае ошибки
    weatherData.value = [
      { temp: 5, icon: 'snow', time: 'Сейчас' },
      { temp: -10, icon: 'snow', time: '+3ч' },
      { temp: 22, icon: 'cloudy', time: '+6ч' }
    ]
  } finally {
    loading.value = false
  }
}

// Функция для получения пути к SVG иконке
const getWeatherIconPath = (iconName) => {
  // Определяем день или ночь (упрощенно по времени)
  const hour = new Date().getHours()
  const isNight = hour < 6 || hour >= 21
  
  // Карта иконок с учетом времени суток
  const iconMap = {
    'clear': isNight ? 'clear_night.svg' : 'clear_day.svg',
    'partly-cloudy': isNight ? 'cloudy-night.svg' : 'cloudy-day.svg',
    'cloudy': isNight ? 'cloudy-night.svg' : 'cloudy-day.svg',
    'drizzle': 'drizzle.svg',
    'rain': 'rain.svg',
    'heavy-rain': 'heavy_rain.svg',
    'snow': 'snow.svg',
    'heavy-snow': 'heavy_snow.svg',
    'thunderstorm': 'thunderstorm.svg'
  }
  
  const fileName = iconMap[iconName] || 'cloudy-day.svg'
  return new URL(`../../amcharts_weather_icons_1.0.0/animated/${fileName}`, import.meta.url).href
}

// Маппинг кодов погоды Open-Meteo на наши иконки
const getWeatherIconFromCode = (code) => {
  // 0 - ясно
  if (code === 0) return 'clear'
  // 1-3 - облачно (разная степень)
  if (code === 1) return 'partly-cloudy'
  if (code === 2 || code === 3) return 'cloudy'
  // 45-48 - туман
  if (code === 45 || code === 48) return 'cloudy'  // Используем облака для тумана
  // 51-57 - морось
  if (code >= 51 && code <= 57) return 'drizzle'
  // 61-67 - дождь
  if (code >= 61 && code <= 67) return 'rain'
  // 71-77 - снег
  if (code >= 71 && code <= 77) return 'snow'
  // 80-82 - ливень
  if (code >= 80 && code <= 82) return 'heavy-rain'
  // 85-86 - снежный ливень
  if (code >= 85 && code <= 86) return 'heavy-snow'
  // 95-99 - гроза
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'cloudy'
}

onMounted(() => {
  console.log('⛅ Weather component mounted, fetching data...')
  fetchWeather()
  // Обновляем погоду каждые 30 минут
  setInterval(fetchWeather, 30 * 60 * 1000)
})
</script>

<style scoped>
.weather-widget {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loading,
.error {
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
}

.error {
  color: #ef4444;
}

.weather-items {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  width: 100%;
}

.weather-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.temperature {
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.temperature.positive {
  color: #4ade80;
}

.temperature.negative {
  color: #60a5fa;
}

.weather-icon {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.weather-svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
}

.time-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0;
}
</style>
