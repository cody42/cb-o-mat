<template>
  <div class="statistics">
    <h2>Player Statistics</h2>
    <div class="player-list">
      <div
        v-for="player in playerStats"
        :key="player.name"
        class="player-stat"
        @click="toggleFilter(player.name)"
        :class="{ active: isPlayerFiltered(player.name) }"
      >
        <div class="player-name">{{ player.name }}</div>
        <div class="stat-details">
          <div class="stat-item">
            <span class="label">Messages:</span>
            <span class="value">{{ player.messageCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Avg Length:</span>
            <span class="value">{{ player.avgMessageLength }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameLogStore } from '../stores/gameLogStore'

const store = useGameLogStore()

const playerStats = computed(() => store.playerStats)

const toggleFilter = (player) => {
  if (store.currentFilter === player) {
    store.setFilter(null)
  } else {
    store.setFilter(player)
  }
}

const isPlayerFiltered = (player) => {
  return store.currentFilter === player
}
</script>

<style scoped>
.statistics {
  margin: 1rem 0;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.player-stat {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-stat:hover {
  background-color: #f8f9fa;
}

.player-stat.active {
  border-color: #007bff;
  background-color: #e7f5ff;
}

.player-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.8rem;
  color: #666;
}

.value {
  font-weight: 500;
}
</style>
