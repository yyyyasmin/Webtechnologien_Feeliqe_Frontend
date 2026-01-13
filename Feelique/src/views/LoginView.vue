<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  try {
    const res = await axios.post(`${baseUrl}/auth/login`, {
      username: username.value,
      password: password.value
    })

    localStorage.setItem('token', res.data.token)
    router.push('/mood') // oder /dashboard
  } catch (e) {
    error.value = 'Login fehlgeschlagen'
  }
}
</script>

<template>
  <div class="login">
    <h2>Login</h2>

    <input v-model="username" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />

    <button @click="login">Login</button>

    <p v-if="error">{{ error }}</p>
  </div>
</template>
