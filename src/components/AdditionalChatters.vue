<template>
    <div class="additional-chatters">
        <h2>Zusätzliche Chatteilnehmer</h2>
        <div class="chatters-list">
            <div
                v-for="(chatter, index) in store.additionalChatters"
                :key="index"
                class="chatter-item"
                :class="{ active: store.currentFilter && store.currentFilter.name === chatter.name }"
                @click="selectChatter(chatter)"
            >
                <div class="chatter-name">{{ chatter.name }}</div>

                <div class="nicks-list" style="flex-basis: 90%;" v-if="[...chatter.nicks].length > 1">
                    <span class="label">Weitere Nicks:</span>
                    <span class="value nicks">
                        {{ [...chatter.nicks].filter(n => n !== chatter.name).join(', ') }}
                    </span>
                </div>
                <button
                    class="btn btn-secondary additional-player-button"
                    @click.stop="makePlayer(chatter)"
                    >
                    Als Spieler hinzufügen
                </button>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import { useGameLogStore } from '../stores/gameLogStore';
const store = useGameLogStore();
const selectChatter = (chatter) => {
    if (store.currentFilter && store.currentFilter.name === chatter.name) {
        store.setFilter(null); // Clear filter if already selected
        return;
    }
    store.setFilter(chatter);
};
const makePlayer = (chatter) => {
    store.addPlayer(chatter);
    store.setFilter(null); // Clear filter after adding player
};
</script>
<style scoped>
.additional-chatters {
    margin: 1rem 0;
}
.chatters-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
.chatter-item {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.chatter-item:hover {
  background-color: #f8f9fa;
}
.chatter-item.active {
  border-color: #007bff;
  background-color: #e7f5ff;
}

.chatter-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
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
.btn {
  margin-top: 0.5rem;
  width: 100%;
}
.btn-secondary {
  background-color: #f8f9fa;
  border: 1px solid #6c757d;
  color: #495057;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:hover {
  background-color: #e2e6ea;
}
.btn-secondary:active {
  background-color: #d6d8db;
}
.btn-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(38, 143, 255, 0.25);
}
</style>