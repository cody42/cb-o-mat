<template>
  <div class="log-display">
    <div class="section-filters">
      <button
        v-for="section in sections"
        :key="section"
        @click="currentSection = section"
        :class="{ active: currentSection === section }"
      >
        {{ section }}
      </button>
      <button
        @click="currentSection = 'All'"
        :class="{ active: currentSection === 'All' }"
      >
        Alles
      </button>
    </div>
    <div class="messages">
      <div
        v-for="(message, index) in filteredMessages"
        :key="index"
        class="message"
        :class="{ highlighted: isHighlighted(message) }"
      >
        <span class="timestamp">{{ message.timestamp }}</span>
        <span class="player">{{ message.nick }}{{ message.type == 'say' ? ':' : '' }}</span>
        <!-- <span class="content">{{ message.content }}</span> -->
         <IrcMessageContent :content="message.content" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameLogStore } from '../stores/gameLogStore'
import IrcMessageContent from './IrcMessageContent.vue'

const store = useGameLogStore()
const sections = ['Vorlauf', 'Missionsvorbereitung', 'Postencheck', 'RS Start', 'RS Ende']
const currentSection = ref('All')

const filteredMessages = computed(() => {
  return store.filteredMessages.filter(msg => 
    currentSection.value === 'All' || msg.section === currentSection.value
  )
})

const isHighlighted = (message) => {
  return store.currentFilter === message.player
}

</script>

<style scoped>
.log-display {
  margin: 1rem 0;
}

.section-filters {
  margin-bottom: 1rem;
}

.section-filters button {
  margin-right: 0.5rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.section-filters button.clear-button {
  background-color: #f8f9fa;
  border-color: #6c757d;
}

.section-filters button.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.messages {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 1rem;
}

.message {
  margin-bottom: 0.5rem;
  font-family: monospace;
}

.message.highlighted {
  background-color: #fff3cd;
}

.timestamp {
  color: #666;
  margin-right: 0.5rem;
}

.player {
  font-weight: bold;
  margin-right: 0.5rem;
}
</style>
