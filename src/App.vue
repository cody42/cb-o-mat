<!-- App.vue -->
<template>
  <div class="app">
    <h1>CB-O-Mat</h1>
    <div class="container">
      <LogInput />
      <LogDisplay />
      <PlayerStatistics />
    </div>
  </div>
</template>

<script setup>
import LogInput from './components/LogInput.vue'
import LogDisplay from './components/LogDisplay.vue'
import PlayerStatistics from './components/PlayerStatistics.vue'
import { useGameLogStore } from './stores/gameLogStore'

const store = useGameLogStore()
</script>

<style>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}
</style>