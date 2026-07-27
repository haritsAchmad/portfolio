import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import './style.css'
import App from './App.vue'

const createAnonymousId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const getOrCreateStorageId = (storage, key) => {
  const existing = storage.getItem(key)
  if (existing) return existing

  const value = createAnonymousId()
  storage.setItem(key, value)
  return value
}

const trackPageView = async () => {
  try {
    const visitorId = getOrCreateStorageId(localStorage, 'portfolio_visitor_id')
    const sessionId = getOrCreateStorageId(sessionStorage, 'portfolio_session_id')

    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: 'page_view',
        path: `${window.location.pathname}${window.location.hash}`,
        visitor_id: visitorId,
        session_id: sessionId,
        referrer: document.referrer,
        metadata: {
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen_width: window.screen.width,
          screen_height: window.screen.height,
        },
      }),
    })
  } catch {
    // Analytics must never interrupt the portfolio experience.
  }
}

inject()
createApp(App).mount('#app')
trackPageView()
