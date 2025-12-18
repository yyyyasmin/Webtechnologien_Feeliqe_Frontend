<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { AxiosResponse } from 'axios'

/* =======================
   Interfaces
======================= */
interface Mood {
  id: number
  emoji: string
  name: string
}

interface MoodEntryDto {
  id?: number
  mood: string
  time: string
}

/* =======================
   Emoji Mapping
======================= */
const emojiMap: Record<string, string> = {
  'Glücklich': '😊',
  'Neutral': '😐',
  'Traurig': '😢',
  'Müde': '😴',
  'Gestresst': '😤',
  'Aufgeregt': '🤩',
  'Sauer': '😡',
  'Entspannt': '😌',
  'Gelangweilt': '🥱',
  'Schlecht': '😞'
}

/* =======================
   Mood-Katalog (Frontend)
======================= */
const moods = ref<Mood[]>([
  { id: 1, name: 'Glücklich', emoji: '😊' },
  { id: 2, name: 'Neutral', emoji: '😐' },
  { id: 3, name: 'Traurig', emoji: '😢' },
  { id: 4, name: 'Müde', emoji: '😴' },
  { id: 5, name: 'Gestresst', emoji: '😤' },
  { id: 6, name: 'Aufgeregt', emoji: '🤩' },
  { id: 7, name: 'Sauer', emoji: '😡' },
  { id: 8, name: 'Entspannt', emoji: '😌' },
  { id: 9, name: 'Gelangweilt', emoji: '🥱' },
  { id: 10, name: 'Schlecht', emoji: '😞' }
])

/* =======================
   State
======================= */
const selectedMood = ref<Mood | null>(null)
const savedMoods = ref<MoodEntryDto[]>([])
const hasSavedMood = ref(false)

/* =======================
   Backend URL
======================= */
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL

/* =======================
   GET gespeicherte Moods
======================= */
async function loadSavedMoods() {
  if (!baseUrl) return

  const response: AxiosResponse<MoodEntryDto[]> =
    await axios.get(`${baseUrl}/moods`)

  savedMoods.value = response.data
}

/* =======================
   POST Mood (FINAL)
======================= */
async function saveMoodToBackend(moodName: string) {
  if (!baseUrl) return

  const payload = {
    mood: moodName,
    time: new Date().toISOString()
  }

  await axios.post(`${baseUrl}/moods`, payload)
  await loadSavedMoods()
}

/* =======================
   Klick → EINMAL FINAL
======================= */
const selectMood = async (mood: Mood) => {
  if (hasSavedMood.value) return

  // 🔒 Zustand sofort fixieren
  hasSavedMood.value = true
  selectedMood.value = mood

  try {
    await saveMoodToBackend(mood.name)
  } catch (e) {
    console.error(e)
  }
}

/* =======================
   On Mount
======================= */
onMounted(() => {
  loadSavedMoods()
})
</script>

<template>
  <div class="mood-tracker">
    <h2>Mein Mood Tracker</h2>
    <p class="subtitle">Wie fühlst du dich heute?</p>

    <ul class="mood-list">
      <li
        v-for="mood in moods"
        :key="mood.id"
        class="mood-item"
        :class="{ selected: selectedMood?.id === mood.id }"
        @click="!hasSavedMood && selectMood(mood)"
      >
        <span class="mood-emoji">{{ mood.emoji }}</span>
        <div class="mood-name">{{ mood.name }}</div>
      </li>
    </ul>

    <div v-if="selectedMood" class="selected-mood">
      Du hast gewählt:
      <strong>{{ selectedMood.emoji }} {{ selectedMood.name }}</strong>
    </div>

    <div v-if="hasSavedMood" class="saved-hint">
      ✅ Deine Stimmung wurde gespeichert
    </div>

    <div class="saved-moods" v-if="savedMoods.length">
      <h3>Gespeicherte Einträge</h3>
      <ul>
        <li v-for="(entry, index) in savedMoods" :key="index">
          {{ emojiMap[entry.mood] ?? '❓' }}
          {{ entry.mood }} –
          {{ new Date(entry.time).toLocaleString() }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mood-tracker {
  max-width: 800px; /* Von 600px auf 800px erhöht */
  margin: 100px auto 40px;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: #e2e8f0;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.mood-tracker h2 {
  text-align: center;
  color: #c4b5fd;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
}

.subtitle {
  text-align: center;
  color: #cbd5e1;
  margin-bottom: 30px;
  font-size: 1.1rem;
}

.mood-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 5 Spalten */
  gap: 15px;
}

.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #2d2463 0%, #3d2f7a 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(139, 92, 246, 0.2);
  min-height: 120px;
}

.mood-item:hover {
  background: linear-gradient(135deg, #3d2f7a 0%, #4c1d95 100%);
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
  border-color: rgba(139, 92, 246, 0.5);
}

.mood-item.selected {
  background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%);
  border: 2px solid #a78bfa;
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.6);
  pointer-events: none;
  transform: scale(1.05);
}

.mood-emoji {
  font-size: 48px;
  margin-bottom: 10px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.mood-name {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  text-align: center;
}

.selected-mood {
  margin-top: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%);
  border-radius: 12px;
  text-align: center;
  font-size: 1.1rem;
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.selected-mood strong {
  color: #c4b5fd;
  font-size: 1.2rem;
}

.saved-hint {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  color: #d1fae5;
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}

.saved-moods {
  margin-top: 40px;
  padding: 25px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.saved-moods h3 {
  color: #a78bfa;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.saved-moods ul {
  list-style: none;
  padding: 0;
}

.saved-moods li {
  padding: 12px;
  margin: 8px 0;
  background: rgba(30, 27, 75, 0.5);
  border-radius: 8px;
  border-left: 3px solid #8b5cf6;
  color: #cbd5e1;
  transition: background 0.2s;
}

.saved-moods li:hover {
  background: rgba(30, 27, 75, 0.8);
}

@media (max-width: 768px) {
  .mood-tracker {
    margin: 80px 20px 40px;
    padding: 25px;
    max-width: 100%; /* Auf kleineren Bildschirmen volle Breite nutzen */
  }

  .mood-list {
    grid-template-columns: repeat(3, 1fr); /* 3 Spalten auf Tablet */
    gap: 10px;
  }

  .mood-item {
    padding: 15px;
    min-height: 100px;
  }

  .mood-emoji {
    font-size: 36px;
  }

  .mood-name {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .mood-list {
    grid-template-columns: repeat(2, 1fr); /* 2 Spalten auf Handy */
    gap: 8px;
  }
}
</style>
