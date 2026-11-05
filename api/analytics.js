import { neon } from '@neondatabase/serverless'

// Privacy-minimized page views. Whatever a client sends (including older
// cached bundles that still post a permanent visitor ID, full referrer URLs,
// timezone, or screen size), only these fields are stored:
//   event_name  'page_view'
//   path        the page path, without query string or fragment
//   visitor_id  always NULL (column kept for schema compatibility)
//   session_id  a random per-browser-session ID, or NULL
//   referrer    the referring site's origin only, or NULL
//   metadata    { device: 'mobile' | 'desktop', language: primary code }

export const MAX_BODY_BYTES = 2048
const MAX_PATH_LENGTH = 255
const SESSION_PATTERN = /^[A-Za-z0-9-]{8,64}$/
const LANGUAGE_PATTERN = /^[a-z]{2,3}$/
const DEVICES = new Set(['mobile', 'desktop'])

const invalid = () => Response.json({ error: 'Invalid analytics event.' }, { status: 400 })
const tooLarge = () => Response.json({ error: 'Analytics payload too large.' }, { status: 413 })

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const originOf = (value) => {
  if (typeof value !== 'string' || value.length > 2000) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null
  } catch {
    return null
  }
}

// sanitizeEvent returns the row to store, or null when the event is rejected.
export const sanitizeEvent = (body) => {
  if (!isPlainObject(body) || body.event_name !== 'page_view') return null
  if (typeof body.path !== 'string') return null
  const path = body.path.split(/[?#]/)[0]
  if (!path.startsWith('/') || path.length > MAX_PATH_LENGTH || /[\u0000-\u001f\u007f]/.test(path)) return null

  const source = isPlainObject(body.metadata) ? body.metadata : {}
  const metadata = {}
  if (DEVICES.has(source.device)) metadata.device = source.device
  const language = typeof source.language === 'string' ? source.language.split('-')[0].toLowerCase() : ''
  if (LANGUAGE_PATTERN.test(language)) metadata.language = language

  return {
    eventName: 'page_view',
    path,
    visitorId: null,
    sessionId: typeof body.session_id === 'string' && SESSION_PATTERN.test(body.session_id) ? body.session_id : null,
    referrer: originOf(body.referrer),
    metadata,
  }
}

// handleAnalytics validates before touching the database. connect returns a
// Neon-style tagged-template client, or null when no database is configured.
export async function handleAnalytics(request, connect) {
  try {
    const declared = Number(request.headers.get('content-length') || 0)
    if (declared > MAX_BODY_BYTES) return tooLarge()
    const text = await request.text()
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return tooLarge()

    let body
    try {
      body = JSON.parse(text)
    } catch {
      return invalid()
    }
    const event = sanitizeEvent(body)
    if (!event) return invalid()

    const sql = connect()
    if (!sql) {
      return Response.json({ error: 'Analytics database is not configured.' }, { status: 503 })
    }

    await sql`
      INSERT INTO analytics_events (
        event_name,
        path,
        visitor_id,
        session_id,
        referrer,
        metadata
      ) VALUES (
        ${event.eventName},
        ${event.path},
        ${event.visitorId},
        ${event.sessionId},
        ${event.referrer},
        ${JSON.stringify(event.metadata)}::jsonb
      )
    `

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Failed to store analytics event:', error instanceof Error ? error.message : 'unknown error')
    return Response.json({ error: 'Failed to store analytics event.' }, { status: 500 })
  }
}

export function POST(request) {
  return handleAnalytics(request, () => (process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null))
}
