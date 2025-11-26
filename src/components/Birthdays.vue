<template>
  <div class="birthdays-widget">
    <div class="separator"></div>
    <div class="birthdays-list">
      <div v-for="(person, index) in birthdays" :key="index" class="birthday-item">
        <div class="name">{{ person.name }}</div>
        <div class="date">{{ person.date }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const birthdays = ref([])

const loadBirthdays = async () => {
  try {
    const response = await fetch('/birthdays.csv')
    const text = await response.text()
    
    // Парсим CSV (пропускаем первую строку с заголовками)
    const lines = text.trim().split('\n').slice(1)
    
    birthdays.value = lines.map(line => {
      const [name, date] = line.split(',')
      return {
        name: name.trim(),
        date: date.trim()
      }
    }).filter(item => item.name && item.date) // Фильтруем пустые строки
    
    console.log('Loaded birthdays:', birthdays.value)
  } catch (error) {
    console.error('Error loading birthdays:', error)
    // Fallback данные на случай ошибки
    birthdays.value = [
      { name: 'Диана', date: '23 декабря' },
      { name: 'Ростислав', date: '11 января' }
    ]
  }
}

onMounted(() => {
  loadBirthdays()
})
</script>

<style scoped>
.birthdays-widget {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.separator {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%
  );
  border-radius: 1px;
}

.birthdays-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.birthday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.name {
  font-size: 1.3rem;
  color: white;
  font-weight: 500;
}

.date {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.7);
}
</style>
