import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './axios' // 👈 WICHTIG: Interceptor wird aktiviert

createApp(App)
  .use(router)
  .mount('#app')
