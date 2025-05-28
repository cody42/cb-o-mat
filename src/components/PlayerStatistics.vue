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
          <div class="stat-item nicks-list" v-if="player.nicks.length > 1">
            <span class="label">Also known as:</span>
            <span class="value nicks">
              {{ player.nicks.filter(n => n !== player.name).join(', ') }}
            </span>
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.nicks-list {
  grid-column: 1 / -1;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.nicks {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.label {
  font-size: 0.8rem;
  color: #666;
}

.value {
  font-weight: 500;
}

.debug-section {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.json-debug {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 0.9rem;
  margin: 0;
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>
