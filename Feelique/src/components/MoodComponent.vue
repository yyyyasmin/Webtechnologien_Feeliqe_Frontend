<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  note?: string
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
const note = ref('')

/* Filter/Search/Calendar State */
const searchQuery = ref('')
const selectedDate = ref('') // YYYY-MM-DD
const mode = ref<'all' | 'date' | 'search'>('all')

/* Edit State */
const editingId = ref<number | null>(null)
const editMood = ref<string>('')
const editNote = ref<string>('')

/* =======================
   Backend URL
======================= */
const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL

/* =======================
   GET: alles laden
======================= */
async function loadSavedMoods() {
  if (!baseUrl) return
  const response: AxiosResponse<MoodEntryDto[]> = await axios.get(`${baseUrl}/moods`)
  savedMoods.value = response.data
}

/* =======================
   GET: nach Datum laden (Kalender)
======================= */
async function loadMoodsByDate(date: string) {
  if (!baseUrl) return
  const response: AxiosResponse<MoodEntryDto[]> = await axios.get(`${baseUrl}/moods/by-date`, {
    params: { date }
  })
  savedMoods.value = response.data
}

/* =======================
   GET: Suche
======================= */
async function searchMoods(q: string) {
  if (!baseUrl) return
  const response: AxiosResponse<MoodEntryDto[]> = await axios.get(`${baseUrl}/moods/search`, {
    params: { q }
  })
  savedMoods.value = response.data
}

/* =======================
   POST: Mood + Note speichern
======================= */
async function saveMoodToBackend(moodName: string) {
  if (!baseUrl) return

  const payload = {
    mood: moodName,
    time: new Date().toISOString(),
    note: note.value
  }

  await axios.post(`${baseUrl}/moods`, payload)
  await loadSavedMoods()
}

/* =======================
   DELETE: Eintrag löschen
======================= */
async function deleteEntry(id?: number) {
  if (!baseUrl || !id) return
  await axios.delete(`${baseUrl}/moods/${id}`)
  await refreshListAfterAction()
}

/* =======================
   EDIT: Start
======================= */
function startEdit(entry: MoodEntryDto) {
  editingId.value = entry.id ?? null
  editMood.value = entry.mood
  editNote.value = entry.note ?? ''
}

/* =======================
   EDIT: abbrechen
======================= */
function cancelEdit() {
  editingId.value = null
  editMood.value = ''
  editNote.value = ''
}

/* =======================
   PUT: Eintrag updaten
======================= */
async function saveEdit() {
  if (!baseUrl || editingId.value == null) return

  const payload: MoodEntryDto = {
    mood: editMood.value,
    time: new Date().toISOString(), // optional: oder alte Zeit beibehalten, wenn Backend das macht
    note: editNote.value
  }

  await axios.put(`${baseUrl}/moods/${editingId.value}`, payload)
  cancelEdit()
  await refreshListAfterAction()
}

/* =======================
   Helper: nach Aktion Liste passend neu laden
======================= */
async function refreshListAfterAction() {
  if (mode.value === 'date' && selectedDate.value) {
    await loadMoodsByDate(selectedDate.value)
  } else if (mode.value === 'search' && searchQuery.value.trim()) {
    await searchMoods(searchQuery.value.trim())
  } else {
    await loadSavedMoods()
  }
}

/* =======================
   Klick → Mood wählen
======================= */
const selectMood = (mood: Mood) => {
  if (hasSavedMood.value) return
  selectedMood.value = mood
}

/* Speichern Button */
const saveSelectedMood = async () => {
  if (!selectedMood.value || hasSavedMood.value) return
  await saveMoodToBackend(selectedMood.value.name)
  hasSavedMood.value = true
}

/* =======================
   Filter UI Aktionen
======================= */
async function applyAll() {
  mode.value = 'all'
  selectedDate.value = ''
  searchQuery.value = ''
  await loadSavedMoods()
}

async function applyDateFilter() {
  if (!selectedDate.value) return
  mode.value = 'date'
  await loadMoodsByDate(selectedDate.value)
}

async function applySearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  mode.value = 'search'
  await searchMoods(q)
}

/* Optional: sort newest first (frontend) */
const sortedSavedMoods = computed(() => {
  return [...savedMoods.value].sort((a, b) => {
    const ta = new Date(a.time).getTime()
    const tb = new Date(b.time).getTime()
    return tb - ta
  })
})

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

    <!-- Mood Auswahl -->
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

    <!-- Notiz + Speichern -->
    <div v-if="selectedMood && !hasSavedMood" class="note-section">
      <label for="note">Notiz (optional):</label>
      <textarea
        id="note"
        v-model="note"
        rows="3"
        placeholder="Möchtest du etwas zu deiner Stimmung aufschreiben?"
      ></textarea>

      <button @click="saveSelectedMood" class="save-button">
        Stimmung & Notiz speichern
      </button>
    </div>

    <div v-if="hasSavedMood" class="saved-hint">
      ✅ Deine Stimmung wurde gespeichert
      <button class="small-btn" @click="hasSavedMood=false; selectedMood=null; note=''">
        Neue Eingabe
      </button>
    </div>

    <!-- Filter / Suche / Kalender -->
    <div class="controls">
      <button class="small-btn" @click="applyAll">Alle</button>

      <div class="control-group">
        <input type="date" v-model="selectedDate" />
        <button class="small-btn" @click="applyDateFilter">Datum</button>
      </div>

      <div class="control-group">
        <input type="text" v-model="searchQuery" placeholder="Suche (Mood/Notiz)..." />
        <button class="small-btn" @click="applySearch">Suchen</button>
      </div>
    </div>

    <!-- Gespeicherte Einträge -->
    <div class="saved-moods" v-if="sortedSavedMoods.length">
      <h3>Gespeicherte Einträge</h3>
      <ul>
        <li v-for="entry in sortedSavedMoods" :key="entry.id">
          <div class="entry-row">
            <div class="entry-main">
              <div>
                {{ emojiMap[entry.mood] ?? '❓' }}
                <strong>{{ entry.mood }}</strong>
                – {{ new Date(entry.time).toLocaleString() }}
              </div>
              <div v-if="entry.note" class="note-text">
                💬 {{ entry.note }}
              </div>
            </div>

            <div class="entry-actions">
              <button class="small-btn" @click="startEdit(entry)">Bearbeiten</button>
              <button class="small-btn danger" @click="deleteEntry(entry.id)">Löschen</button>
            </div>
          </div>

          <!-- Edit Bereich -->
          <div v-if="editingId === entry.id" class="edit-box">
            <label>Mood:</label>
            <input v-model="editMood" />

            <label>Notiz:</label>
            <textarea v-model="editNote" rows="2"></textarea>

            <div class="edit-actions">
              <button class="small-btn" @click="saveEdit">Speichern</button>
              <button class="small-btn danger" @click="cancelEdit">Abbrechen</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="saved-moods" v-else>
      <h3>Gespeicherte Einträge</h3>
      <p>Keine Einträge gefunden.</p>
    </div>
  </div>
</template>

<style scoped>
/* dein Style bleibt größtenteils, ich ergänze nur Controls + Buttons minimal */

.controls{
  margin-top: 25px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.control-group{
  display: flex;
  gap: 8px;
  align-items: center;
}

.control-group input{
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(139,92,246,0.3);
  background: rgba(30,27,75,0.35);
  color: #e2e8f0;
}

.small-btn{
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: rgba(139,92,246,0.35);
  color: #e2e8f0;
  cursor: pointer;
}

.small-btn:hover{
  background: rgba(139,92,246,0.55);
}

.small-btn.danger{
  background: rgba(239,68,68,0.35);
}

.small-btn.danger:hover{
  background: rgba(239,68,68,0.55);
}

.entry-row{
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.entry-actions{
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.edit-box{
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.25);
}

.edit-box input,
.edit-box textarea{
  width: 100%;
  margin-top: 6px;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(139,92,246,0.25);
  background: rgba(30,27,75,0.4);
  color: #e2e8f0;
}

.edit-actions{
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
