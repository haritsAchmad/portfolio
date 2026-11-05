import { expect, test } from '@playwright/test'
import { MAX_BODY_BYTES, handleAnalytics, sanitizeEvent } from '../../api/analytics.js'
import { LEGACY_VISITOR_KEY, SESSION_KEY, deviceCategory, forgetLegacyVisitor, pageViewPayload, primaryLanguage, referrerOrigin, sessionId } from '../../src/analytics.js'

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

// A Neon-style tagged-template client that records what would be inserted.
const recordingDatabase = () => {
  const inserts = []
  const sql = (strings, ...values) => {
    inserts.push(values)
    return Promise.resolve([])
  }
  return { inserts, connect: () => sql }
}

const post = (body, headers = {}) => new Request('http://localhost/api/analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})

const memoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    has: key => values.has(key),
  }
}

test('legacy payload is stored without visitor ID, full referrer, timezone, or screen size', async ({}, testInfo) => {
  annotate(testInfo, { endpoint: 'POST /api/analytics (direct handler, recording database)', expected: 'Only minimized fields reach INSERT', risk: 'Medium — personal data retention', root_cause: 'Raw client metadata stored as-is' })
  const db = recordingDatabase()
  const legacy = {
    event_name: 'page_view',
    path: '/?utm_source=newsletter#contact',
    visitor_id: '7f1c2d3e-aaaa-bbbb-cccc-1234567890ab',
    session_id: '1b2c3d4e-aaaa-bbbb-cccc-1234567890ab',
    referrer: 'https://www.google.com/search?q=harits+achmad+fauzan',
    metadata: { language: 'id-ID', timezone: 'Asia/Jakarta', screen_width: 1920, screen_height: 1080, email: 'someone@example.com' },
  }
  const response = await handleAnalytics(post(legacy), db.connect)
  expect(response.status).toBe(204)
  expect(db.inserts).toHaveLength(1)
  const [eventName, path, visitorId, session, referrer, metadata] = db.inserts[0]
  expect(eventName).toBe('page_view')
  expect(path).toBe('/')
  expect(visitorId).toBeNull()
  expect(session).toBe(legacy.session_id)
  expect(referrer).toBe('https://www.google.com')
  expect(JSON.parse(metadata)).toEqual({ language: 'id' })
  expect(JSON.stringify(db.inserts)).not.toMatch(/Asia\/Jakarta|1920|someone@example|harits\+achmad|utm_source|7f1c2d3e/)
})

test('current payload stores only device and primary language', async () => {
  const db = recordingDatabase()
  const payload = pageViewPayload({ path: '/', referrer: 'https://www.linkedin.com/in/x?trk=abc', language: 'en-US', viewportWidth: 390, session: 'abcdef12-3456-7890-abcd-ef1234567890' })
  expect(payload).toEqual({
    event_name: 'page_view',
    path: '/',
    session_id: 'abcdef12-3456-7890-abcd-ef1234567890',
    referrer: 'https://www.linkedin.com',
    metadata: { device: 'mobile', language: 'en' },
  })
  expect(payload).not.toHaveProperty('visitor_id')
  const response = await handleAnalytics(post(payload), db.connect)
  expect(response.status).toBe(204)
  expect(JSON.parse(db.inserts[0][5])).toEqual({ device: 'mobile', language: 'en' })
})

test('malformed and disallowed requests never reach the database', async ({}, testInfo) => {
  annotate(testInfo, { endpoint: 'POST /api/analytics (direct handler, recording database)', expected: '400/413 before any INSERT', risk: 'Medium — arbitrary writes and storage abuse', root_cause: 'Validation after database access or missing limits' })
  const db = recordingDatabase()
  const valid = { event_name: 'page_view', path: '/' }
  const cases = [
    ['not JSON', post('{event_name: page_view'), 400],
    ['JSON array', post([valid]), 400],
    ['JSON null', post('null'), 400],
    ['legacy click event', post({ ...valid, event_name: 'github_click' }), 400],
    ['unknown event', post({ ...valid, event_name: 'purchase' }), 400],
    ['missing path', post({ event_name: 'page_view' }), 400],
    ['absolute URL as path', post({ ...valid, path: 'https://evil.example/' }), 400],
    ['path too long', post({ ...valid, path: `/${'a'.repeat(300)}` }), 400],
    ['control character in path', post({ ...valid, path: '/a\u0000b' }), 400],
    ['oversized body', post({ ...valid, metadata: { note: 'x'.repeat(MAX_BODY_BYTES) } }), 413],
    ['oversized declared length', post(valid, { 'content-length': String(MAX_BODY_BYTES + 1) }), 413],
  ]
  for (const [name, request, status] of cases) {
    const response = await handleAnalytics(request, db.connect)
    expect(response.status, name).toBe(status)
  }
  expect(db.inserts).toHaveLength(0)
})

test('field values outside the allowlist are dropped, not stored', () => {
  const event = sanitizeEvent({
    event_name: 'page_view',
    path: '/',
    session_id: 'short',
    referrer: 'javascript:alert(1)',
    metadata: { device: 'smart-fridge', language: 'english', extra: { nested: true } },
  })
  expect(event).toEqual({ eventName: 'page_view', path: '/', visitorId: null, sessionId: null, referrer: null, metadata: {} })
  expect(sanitizeEvent({ event_name: 'page_view', path: '/', metadata: ['device', 'mobile'] }).metadata).toEqual({})
  expect(sanitizeEvent({ event_name: 'page_view', path: '/', session_id: 'a'.repeat(65) }).sessionId).toBeNull()
  expect(sanitizeEvent({ event_name: 'page_view', path: '/', referrer: 'data:text/html,hi' }).referrer).toBeNull()
})

test('database failures return a generic error without details', async () => {
  const response = await handleAnalytics(post({ event_name: 'page_view', path: '/' }), () => () => Promise.reject(new Error('password authentication failed for user neondb_owner')))
  expect(response.status).toBe(500)
  const body = await response.text()
  expect(body).toBe('{"error":"Failed to store analytics event."}')
})

test('client helpers minimize language, referrer, device, and session data', () => {
  expect(primaryLanguage('id-ID')).toBe('id')
  expect(primaryLanguage('EN')).toBe('en')
  expect(primaryLanguage('')).toBeNull()
  expect(primaryLanguage('x-klingon')).toBeNull()
  expect(referrerOrigin('https://github.com/haritsAchmad?tab=repositories')).toBe('https://github.com')
  expect(referrerOrigin('')).toBeNull()
  expect(referrerOrigin('file:///C:/Users/me/page.html')).toBeNull()
  expect(deviceCategory(390)).toBe('mobile')
  expect(deviceCategory(768)).toBe('mobile')
  expect(deviceCategory(1280)).toBe('desktop')

  const storage = memoryStorage()
  const first = sessionId(storage)
  expect(first).toMatch(/^[A-Za-z0-9-]{8,64}$/)
  expect(sessionId(storage)).toBe(first)
  expect(storage.getItem(SESSION_KEY)).toBe(first)

  const legacy = memoryStorage({ [LEGACY_VISITOR_KEY]: 'old-permanent-id' })
  forgetLegacyVisitor(legacy)
  expect(legacy.has(LEGACY_VISITOR_KEY)).toBe(false)
  forgetLegacyVisitor({ removeItem: () => { throw new Error('blocked') } })
})

test('page load removes the old permanent visitor ID and stores none', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / with legacy localStorage', expected: 'portfolio_visitor_id removed; no new permanent ID', risk: 'Low — long-lived tracking identifier', root_cause: 'Legacy identifier left in visitors\' browsers' })
  await page.addInitScript(key => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, 'old-permanent-id')
      sessionStorage.setItem('seeded', '1')
    }
  }, LEGACY_VISITOR_KEY)
  await page.goto('/')
  await expect(page.locator('#hero')).toHaveCount(1)
  const stored = await page.evaluate(() => Object.keys(localStorage))
  expect(stored).not.toContain(LEGACY_VISITOR_KEY)
})

test('privacy notice is bilingual and matches the implementation', async ({ page }) => {
  await page.goto('/')
  const notice = page.locator('#privacy')
  await notice.locator('summary').click()
  await expect(notice).toContainText('no permanent visitor ID')
  await expect(notice).toContainText('not the full address')
  await expect(notice).toContainText('not yet deleted automatically')
  await expect(notice).not.toContainText(/anonymous|consent/i)
  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expect(notice).toContainText('tidak memakai ID pengunjung permanen')
})
