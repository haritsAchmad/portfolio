import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import './style.css'
import App from './App.vue'

const ANALYTICS_HOSTS = new Set([
  'portfolio-pied-ten-84.vercel.app',
])
const VISITOR_KEY = 'portfolio_visitor_id'
const SESSION_KEY = 'portfolio_session_id'
const LAST_TRACKED_KEY = 'portfolio_last_page_view'
const PAGE_VIEW_COOLDOWN_MS = 30 * 60 * 1000

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

const shouldTrack = () => {
  if (!ANALYTICS_HOSTS.has(window.location.hostname)) return false
  if (navigator.webdriver) return false
  return true
}

const wasTrackedRecently = (path) => {
  try {
    const previous = JSON.parse(sessionStorage.getItem(LAST_TRACKED_KEY) || '{}')
    return previous.path === path && Date.now() - Number(previous.at || 0) < PAGE_VIEW_COOLDOWN_MS
  } catch {
    return false
  }
}

const rememberPageView = (path) => {
  sessionStorage.setItem(LAST_TRACKED_KEY, JSON.stringify({ path, at: Date.now() }))
}

const trackPageView = async () => {
  if (!shouldTrack()) return

  const path = window.location.pathname
  if (wasTrackedRecently(path)) return

  try {
    const visitorId = getOrCreateStorageId(localStorage, VISITOR_KEY)
    const sessionId = getOrCreateStorageId(sessionStorage, SESSION_KEY)

    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: 'page_view',
        path,
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

    if (response.ok) rememberPageView(path)
  } catch {
    // Analytics must never interrupt the portfolio experience.
  }
}

inject()
createApp(App).mount('#app')
trackPageView()
