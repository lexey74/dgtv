<template>
  <div class="tv-app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// Обработка навигации с пульта ДУ
const handleKeydown = (event) => {
  const key = event.key
  
  // Стандартные кнопки пульта Android TV
  switch(key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'Enter':
      event.preventDefault()
      // Логика навигации будет в компонентах
      break
    case 'Escape':
    case 'Backspace':
      event.preventDefault()
      // Возврат назад
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
.tv-app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
