import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import './style.css'
import App from './App.vue'
import { trackPageView } from './analytics'

inject()
createApp(App).mount('#app')
trackPageView()
