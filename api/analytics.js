import { neon } from '@neondatabase/serverless'

const allowedEvents = new Set([
  'page_view',
  'github_click',
  'linkedin_click',
  'resume_download',
])

const cleanText = (value, maxLength) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

export async function POST(request) {
  try {
    const body = await request.json()
    const eventName = cleanText(body.event_name, 50)
    const path = cleanText(body.path, 255)
    const visitorId = cleanText(body.visitor_id, 64) || null
    const sessionId = cleanText(body.session_id, 64) || null
    const referrer = cleanText(body.referrer, 2000) || null
    const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {}

    if (!allowedEvents.has(eventName) || !path) {
      return Response.json({ error: 'Invalid analytics event.' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return Response.json({ error: 'Analytics database is not configured.' }, { status: 503 })
    }

    const sql = neon(process.env.DATABASE_URL)

    await sql`
      INSERT INTO analytics_events (
        event_name,
        path,
        visitor_id,
        session_id,
        referrer,
        metadata
      ) VALUES (
        ${eventName},
        ${path},
        ${visitorId},
        ${sessionId},
        ${referrer},
        ${JSON.stringify(metadata)}::jsonb
      )
    `

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Failed to store analytics event:', error)
    return Response.json({ error: 'Failed to store analytics event.' }, { status: 500 })
  }
}
