// Privacy-minimized page-view analytics. Only a session-scoped random ID,
// the page path, the referring site's origin, the primary browser language,
// and a coarse device category leave the browser. The server enforces the
// same limits (api/analytics.js), so this file is not the only safeguard.

export const SESSION_KEY = 'portfolio_session_id'
// Earlier versions kept a permanent visitor ID in localStorage.
export const LEGACY_VISITOR_KEY = 'portfolio_visitor_id'
const LAST_TRACKED_KEY = 'portfolio_last_page_view'
const PAGE_VIEW_COOLDOWN_MS = 30 * 60 * 1000
const MOBILE_MAX_WIDTH = 768

export const ANALYTICS_HOSTS = new Set(['portfolio-pied-ten-84.vercel.app'])

export const referrerOrigin = (referrer) => {
  try {
    const url = new URL(referrer)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null
  } catch {
    return null
  }
}

export const primaryLanguage = (language) => {
  const primary = String(language || '').split('-')[0].toLowerCase()
  return /^[a-z]{2,3}$/.test(primary) ? primary : null
}

export const deviceCategory = (viewportWidth) => (viewportWidth <= MOBILE_MAX_WIDTH ? 'mobile' : 'desktop')

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const sessionId = (storage) => {
  const existing = storage.getItem(SESSION_KEY)
  if (existing) return existing
  const value = createSessionId()
  storage.setItem(SESSION_KEY, value)
  return value
}

export const pageViewPayload = ({ path, referrer, language, viewportWidth, session }) => {
  const metadata = { device: deviceCategory(viewportWidth) }
  const lang = primaryLanguage(language)
  if (lang) metadata.language = lang
  return {
    event_name: 'page_view',
    path,
    session_id: session,
    referrer: referrerOrigin(referrer),
    metadata,
  }
}

// Returns localStorage / sessionStorage, or null when the browser blocks it.
// Reading the property itself throws a SecurityError when site data is disabled.
export const browserStorage = (name) => {
  try {
    return globalThis[name] ?? null
  } catch {
    return null
  }
}

// Removes the permanent ID left by earlier versions, on every host.
export const forgetLegacyVisitor = (storage) => {
  try {
    storage.removeItem(LEGACY_VISITOR_KEY)
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

const wasTrackedRecently = (storage, path) => {
  try {
    const previous = JSON.parse(storage.getItem(LAST_TRACKED_KEY) || '{}')
    return previous.path === path && Date.now() - Number(previous.at || 0) < PAGE_VIEW_COOLDOWN_MS
  } catch {
    return false
  }
}

export const trackPageView = async () => {
  const local = browserStorage('localStorage')
  if (local) forgetLegacyVisitor(local)
  if (!ANALYTICS_HOSTS.has(window.location.hostname) || navigator.webdriver) return

  // Without session storage the view is skipped: there is nowhere to keep the
  // per-visit ID, and no other identifier is used in its place.
  const session = browserStorage('sessionStorage')
  if (!session) return

  const path = window.location.pathname
  if (wasTrackedRecently(session, path)) return

  try {
    const payload = pageViewPayload({
      path,
      referrer: document.referrer,
      language: navigator.language,
      viewportWidth: window.innerWidth,
      session: sessionId(session),
    })
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload),
    })
    if (response.ok) session.setItem(LAST_TRACKED_KEY, JSON.stringify({ path, at: Date.now() }))
  } catch {
    // Analytics must never interrupt the portfolio experience.
  }
}
