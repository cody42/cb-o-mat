<!-- App.vue -->
<template>
  <div>
    <h1>IRC Game Log Analyzer</h1>
    <input type="file" @change="handleFileUpload" />
    <textarea v-model="logInput" placeholder="Paste chat log here"></textarea>
    <button @click="parseLog">Parse Log</button>

    <div v-if="parsedLog.length">
      <h2>Parsed Log</h2>
      <pre>{{ parsedLog }}</pre>

      <h2>Players</h2>
      <ul>
        <li v-for="player in players" :key="player.name">
          {{ player.name }} ({{ player.nicks.join(', ') }})
        </li>
      </ul>

      <h2>Statistics</h2>
      <table>
        <tr>
          <th>Player</th>
          <th>Post Count</th>
          <th>Post Length Histogram</th>
        </tr>
        <tr v-for="stat in stats" :key="stat.player">
          <td>{{ stat.player }}</td>
          <td>{{ stat.count }}</td>
          <td>{{ stat.histogram }}</td>
        </tr>
      </table>

      <h2>Filter Log by Player</h2>
      <select v-model="selectedPlayer">
        <option v-for="player in players" :key="player.name">{{ player.name }}</option>
      </select>
      <button @click="filterByPlayer">Filter</button>
      <pre v-if="filteredLog">{{ filteredLog }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameLogStore } from './stores/gameLogStore';

const store = useGameLogStore();
const logInput = ref('');
const selectedPlayer = ref('');
const filteredLog = ref('');

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      logInput.value = e.target.result;
    };
    reader.readAsText(file);
  }
};

const parseLog = () => {
  store.processLog(logInput.value);
};

const filterByPlayer = () => {
  filteredLog.value = store.getFilteredLog(selectedPlayer.value);
};

const { parsedLog, players, stats } = store;
</script>