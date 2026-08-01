import fs from 'node:fs'
import { expect, test } from '@playwright/test'

test('deployment policy defines required security headers', async ({}, testInfo) => {
  testInfo.annotations.push(
    { type: 'endpoint', description: 'Vercel response policy for /(.*)' },
    { type: 'expected', description: 'CSP, anti-framing, nosniff, referrer, and permissions policy' },
    { type: 'risk', description: 'Medium — XSS impact, framing, MIME confusion, and privacy leakage' },
    { type: 'root_cause', description: 'Missing or weakened vercel.json header policy' },
  )
  const config = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'))
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key.toLowerCase(), value]))
  expect(headers['content-security-policy']).toContain("object-src 'none'")
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['permissions-policy']).toContain('camera=()')
})
