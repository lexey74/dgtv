<template>
  <div class="clock-widget">
    <svg class="clock" viewBox="0 0 200 200">
      <!-- Clock face -->
      <circle cx="100" cy="100" r="95" fill="#1a1a22" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      
      <!-- Hour markers (lines for 1,2,4,5,7,8,10,11) -->
      <g v-for="hour in [1,2,4,5,7,8,10,11]" :key="hour">
        <line
          :x1="100"
          :y1="15"
          :x2="100"
          :y2="25"
          :transform="`rotate(${hour * 30} 100 100)`"
          stroke="rgba(255,255,255,0.6)"
          stroke-width="3"
        />
      </g>
      
      <!-- Numbers 12, 3, 6, 9 -->
      <text x="100" y="30" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial, sans-serif">12</text>
      <text x="170" y="105" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial, sans-serif">3</text>
      <text x="100" y="178" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial, sans-serif">6</text>
      <text x="30" y="105" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial, sans-serif">9</text>
      
      <!-- Hour hand -->
      <line
        :x1="100"
        :y1="100"
        :x2="100"
        :y2="50"
        :transform="`rotate(${hourAngle} 100 100)`"
        stroke="white"
        stroke-width="6"
        stroke-linecap="round"
      />
      
      <!-- Minute hand -->
      <line
        :x1="100"
        :y1="100"
        :x2="100"
        :y2="30"
        :transform="`rotate(${minuteAngle} 100 100)`"
        stroke="white"
        stroke-width="4"
        stroke-linecap="round"
      />
      
      <!-- Second hand -->
      <line
        :x1="100"
        :y1="100"
        :x2="100"
        :y2="25"
        :transform="`rotate(${secondAngle} 100 100)`"
        stroke="#ff6b35"
        stroke-width="2"
        stroke-linecap="round"
      />
      
      <!-- Center dot -->
      <circle cx="100" cy="100" r="8" fill="#ff6b35"/>
      <circle cx="100" cy="100" r="4" fill="#1a1a22"/>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const hourAngle = ref(0)
const minuteAngle = ref(0)
const secondAngle = ref(0)

let interval

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours() % 12
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()
  
  hourAngle.value = (hours * 30) + (minutes * 0.5)
  minuteAngle.value = minutes * 6
  secondAngle.value = seconds * 6
}

onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style scoped>
.clock-widget {
  display: flex;
  justify-content: center;
  align-items: center;
}

.clock {
  width: 350px;
  height: 350px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}
</style>
