<template>
  <div class="log-input">
    <div class="input-methods">
      <textarea
        v-model="logText"
        placeholder="IRC log hier einfügen..."
        rows="10"
        class="log-textarea"
        @input="handleLogChange"
      ></textarea>
      <div class="file-upload">
        <input
          type="file"
          @change="handleFileUpload"
          accept=".txt,.log"
          id="file-upload"
        >
        <label for="file-upload" class="upload-button">
          Oder Log-Datei hochladen
        </label>
      </div>
      <div class="flavor-select">
        <label>IRC Client:</label>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="selectedFlavor"
              value="HexChat"
              @change="handleFlavorChange"
            >
            HexChat
          </label>
          <label>
            <input
              type="radio"
              v-model="selectedFlavor"
              value="mIRC"
              @change="handleFlavorChange"
            >
            mIRC
          </label>
        </div>
      </div>
      <button @click="submitLog" :disabled="!logText" class="submit-button">
        Log verarbeiten
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useGameLogStore } from '../stores/gameLogStore'

const store = useGameLogStore()
const logText = ref('')
const selectedFlavor = ref('HexChat')

const detectFlavor = (text) => {
  if (!text) return { flavor: 'HexChat', confidence: 0 }
  return store.parser.guessFlavor(text)
}

const handleLogChange = () => {
  const { flavor, confidence } = detectFlavor(logText.value)
  if (confidence >= 0.7 && flavor !== selectedFlavor.value) {
    selectedFlavor.value = flavor
    store.setFlavor(flavor)
  }
}

const handleFlavorChange = () => {
  store.setFlavor(selectedFlavor.value)
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logText.value = e.target.result
      handleLogChange() // Detect flavor after loading file
    }
    reader.readAsText(file)
  }
}

const submitLog = () => {
  store.setLog(logText.value)
  //logText.value = ''
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

.file-upload input[type="file"] {
  transform: scale(0);
  opacity: 0;
  position: absolute;
}

.upload-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.flavor-select {
  margin-bottom: 1rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
