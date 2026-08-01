import { expect, test } from '@playwright/test'
import { POST } from '../../api/analytics.js'

test('analytics fails closed without database configuration', async ({}, testInfo) => {
  testInfo.annotations.push(
    { type: 'endpoint', description: 'POST /api/analytics (direct handler)' },
    { type: 'expected', description: '503 generic JSON without stack trace' },
    { type: 'risk', description: 'Medium — infrastructure error exposure' },
    { type: 'root_cause', description: 'Unconfigured database or leaked exception details' },
  )
  const previous = process.env.DATABASE_URL
  delete process.env.DATABASE_URL
  try {
    const response = await POST(new Request('http://localhost/api/analytics', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event_name: 'page_view', path: '/' }),
    }))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Analytics database is not configured.' })
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previous
  }
})

test('analytics rejects invalid payload before any database access', async ({}, testInfo) => {
  testInfo.annotations.push(
    { type: 'endpoint', description: 'POST /api/analytics (direct handler)' },
    { type: 'expected', description: '400 generic validation error, no database access, no CORS wildcard' },
    { type: 'risk', description: 'Medium — arbitrary analytics writes and cross-origin abuse' },
    { type: 'root_cause', description: 'Validation occurs after infrastructure access or reflects attacker input' },
  )
  const previous = process.env.DATABASE_URL
  delete process.env.DATABASE_URL
  try {
    const response = await POST(new Request('http://localhost/api/analytics', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
      body: JSON.stringify({ event_name: 'not_allowed', path: '/', metadata: '<script>' }),
    }))
    expect(response.status).toBe(400)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    expect(await response.json()).toEqual({ error: 'Invalid analytics event.' })
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previous
  }
})
