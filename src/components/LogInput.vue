<template>
  <div class="log-input">
    <div class="input-methods">
      <textarea
        v-model="logText"
        placeholder="Paste your IRC game session log here..."
        rows="10"
        class="log-textarea"
      ></textarea>
      <div class="file-upload">
        <input
          type="file"
          @change="handleFileUpload"
          accept=".txt,.log"
          id="file-upload"
        >
        <label for="file-upload" class="upload-button">
          Or upload a log file
        </label>
      </div>
      <button @click="submitLog" :disabled="!logText" class="submit-button">
        Process Log
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameLogStore } from '../stores/gameLogStore'

const store = useGameLogStore()
const logText = ref('')

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logText.value = e.target.result
    }
    reader.readAsText(file)
  }
}

const submitLog = () => {
  store.setLog(logText.value)
  logText.value = ''
}
</script>

<style scoped>
.log-input {
  margin: 1rem 0;
}

.log-textarea {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}

.file-upload {
  margin-bottom: 1rem;
}

.upload-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
