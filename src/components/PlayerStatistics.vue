<template>
  <div class="statistics">
    <h2>Spieler Auswertung</h2>
    <div class="player-list">
      <div
        v-for="player in playerStats"
        :key="player.name"
        class="player-stat"
        @click="toggleFilter(player)"
        :class="{ active: isPlayerFiltered(player) }"
      >
        <div class="player-name">{{ player.name }}</div>
        <div class="stat-details">
          <div class="stat-item" style="flex-basis: 25%;">
            <span class="label">Posts:</span>
            <span class="value">{{ player.messageCount }}</span>
          </div>
          <div class="stat-item" style="flex-basis: 25%;">
            <span class="label">&Oslash; Länge:</span>
            <span class="value">{{ player.avgMessageLength }}</span>
          </div>
          <div class="stat-item" style="flex-basis: 40%;">
            <span class="label">Zeichen ges.:</span>
            <span class="value">{{ player.totalCharacters }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Verteilung Post-Länge:</span>
            <div class="histogram-container">
              <div class="histogram">
                <div 
                  v-for="(bin, index) in player.messageHistogram" 
                  :key="index"
                  class="histogram-column"
                >
                  <div
                    class="histogram-bar"
                    :style="{ 
                      height: computeBarHeight(bin.count, maxMessageCount) + 'px',
                    }"
                    :title="`${bin.count} messages between ${bin.minValue} and ${bin.maxValue} characters`"
                    :data-bin-count="bin.count"
                  ></div>
                  <div class="histogram-label">
                    <div class="bin-count">{{ bin.count }}</div>
                    <div class="bin-range">{{ bin.maxValue }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="stat-item nicks-list" v-if="[...player.nicks].length > 1">
            <span class="label">Weitere Nicks:</span>
            <span class="value nicks">
              {{ [...player.nicks].filter(n => n !== player.name).join(', ') }}
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

const maxMessageCount = computed(() => {
  return Math.max(...playerStats.value.map(player => player.messageCount), 1)
})

const toggleFilter = (player) => {
  if (store.currentFilter && store.currentFilter.name === player.name) {
    store.setFilter(null)
  } else {
    store.setFilter(player)
  }
}

const isPlayerFiltered = (player) => {
  return store.currentFilter && store.currentFilter.name === player.name
}

const computeBarHeight = (count, total) => {
  const maxHeight = 100; // maximum height in pixels
  return total ? Math.max(5, (count / total) * maxHeight) : 0;
}
</script>

<style scoped>
.statistics {
  margin: 1rem 0;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  flex: 1 0 30%;
}

.histogram-container {
  margin-top: 0.5rem;
}

.histogram {
  display: flex;
  justify-content: space-between;
  gap: 2px;
  padding: 4px;
  background: #f5f5f5;
  border-radius: 4px;
}

.histogram-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 75px;
}

.histogram-bar {
  width: 100%;
  background: #007bff;
  opacity: 0.7;
  transition: all 0.2s ease;
  border-radius: 2px 2px 0 0;
  min-height: 1px;
}

.histogram-bar[data-bin-count="0"] {
  background: #e9ecef;
}

.histogram-bar:hover {
  opacity: 1;
}

.histogram-label {
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  margin-top: 2px;
}

.bin-count {
  font-weight: bold;
  color: #007bff;
}

.bin-range {
  color: #666;
  font-size: 0.65rem;
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
