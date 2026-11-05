import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { ANALYTICS_HOSTS, LEGACY_VISITOR_KEY, browserStorage, trackPageView } from '../../src/analytics.js'
import { TEST_WEB3FORMS_ACCESS_KEY } from './test-env.js'

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

const memoryStorage = () => {
  const values = new Map()
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    keys: () => [...values.keys()],
  }
}

// Runs fn with browser-like globals, then restores the originals. Storage
// entries given as 'throw' behave like a browser with site data blocked.
const withBrowserGlobals = async (globals, fn) => {
  const saved = {}
  for (const [name, value] of Object.entries(globals)) {
    saved[name] = Object.getOwnPropertyDescriptor(globalThis, name)
    const descriptor = value === 'throw'
      ? { get() { throw new Error('SecurityError: storage is blocked') } }
      : { value, writable: true }
    Object.defineProperty(globalThis, name, { configurable: true, ...descriptor })
  }
  try {
    return await fn()
  } finally {
    for (const [name, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  }
}

const productionPage = (sent) => ({
  window: { location: { hostname: [...ANALYTICS_HOSTS][0], pathname: '/' }, innerWidth: 1280 },
  navigator: { webdriver: false, language: 'en-US' },
  document: { referrer: '' },
  fetch: async (url, options) => {
    sent.push({ url, body: JSON.parse(options.body) })
    return { ok: true }
  },
})

// Blocks localStorage and sessionStorage the way browsers do when site data is disabled.
const blockStorage = () => {
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, name, {
      configurable: true,
      get() { throw new DOMException('The operation is insecure.', 'SecurityError') },
    })
  }
}

const collectPageErrors = page => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

const mockWeb3Forms = async (page, reply = { status: 200, body: { success: true } }) => {
  const calls = { count: 0 }
  await page.route('https://api.web3forms.com/**', route => {
    calls.count += 1
    const { status, body } = typeof reply === 'function' ? reply() : reply
    return route.fulfill({ status, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) })
  })
  return calls
}

const fillContact = async (page, message = 'Disposable test message') => {
  await page.locator('#name').fill('Test User')
  await page.locator('#email').fill('security@example.test')
  await page.locator('#message').fill(message)
}

test.describe('blocked browser storage', () => {
  test('browserStorage returns null instead of throwing', async () => {
    await withBrowserGlobals({ localStorage: 'throw' }, async () => {
      expect(browserStorage('localStorage')).toBeNull()
    })
    const storage = memoryStorage()
    await withBrowserGlobals({ sessionStorage: storage }, async () => {
      expect(browserStorage('sessionStorage')).toBe(storage)
    })
  })

  test('analytics still sends a minimized page view when only localStorage is blocked', async ({}, testInfo) => {
    annotate(testInfo, { endpoint: 'trackPageView (stubbed browser globals)', expected: 'No exception; session-only payload', risk: 'Low — analytics crash or identifier fallback', root_cause: 'Storage access outside error handling' })
    const sent = []
    const session = memoryStorage()
    await withBrowserGlobals({ ...productionPage(sent), localStorage: 'throw', sessionStorage: session }, async () => {
      await expect(trackPageView()).resolves.toBeUndefined()
    })
    expect(sent).toHaveLength(1)
    expect(sent[0].url).toBe('/api/analytics')
    expect(Object.keys(sent[0].body).sort()).toEqual(['event_name', 'metadata', 'path', 'referrer', 'session_id'])
    expect(sent[0].body.session_id).toMatch(/^[A-Za-z0-9-]{8,64}$/)
    expect(JSON.stringify(sent[0].body)).not.toContain(LEGACY_VISITOR_KEY)
  })

  test('analytics skips the page view, without throwing, when all storage is blocked', async () => {
    const sent = []
    await withBrowserGlobals({ ...productionPage(sent), localStorage: 'throw', sessionStorage: 'throw' }, async () => {
      await expect(trackPageView()).resolves.toBeUndefined()
    })
    // No per-visit ID can be kept, and no other identifier replaces it.
    expect(sent).toHaveLength(0)
  })

  test('page loads and the contact form works when storage access throws', async ({ page }, testInfo) => {
    annotate(testInfo, { endpoint: 'GET / + POST Web3Forms (intercepted)', expected: 'No page errors; send, confirm, then cooldown in memory', risk: 'Low — broken form for privacy-conscious visitors', root_cause: 'Unhandled SecurityError from localStorage' })
    const errors = collectPageErrors(page)
    await page.addInitScript(blockStorage)
    const calls = await mockWeb3Forms(page)
    await page.goto('/#contact')
    await expect(page.locator('#hero')).toHaveCount(1)

    await fillContact(page)
    await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
    await expect(page.getByRole('status')).toContainText('Message sent!')
    expect(calls.count).toBe(1)

    // The cooldown still applies for this page even though it cannot be stored.
    await expect(page.locator('#name')).toBeVisible({ timeout: 8000 })
    await fillContact(page, 'Second disposable message')
    await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
    await expect(page.getByRole('alert')).toContainText('30 seconds')
    expect(calls.count).toBe(1)
    expect(errors).toEqual([])
  })

  test('a full or read-only localStorage does not turn a sent message into an error', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError') }
    })
    await mockWeb3Forms(page)
    await page.goto('/#contact')
    await fillContact(page)
    await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
    await expect(page.getByRole('status')).toContainText('Message sent!')
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('contact form confirmation', () => {
  test('success is announced in a status region that exists before sending', async ({ page }, testInfo) => {
    annotate(testInfo, { endpoint: 'POST Web3Forms (intercepted)', expected: 'role=status announces the confirmation in the active language', risk: 'Low — screen-reader users miss the result', root_cause: 'Confirmation rendered without a live region' })
    await mockWeb3Forms(page)
    await page.goto('/#contact')
    const status = page.getByRole('status')
    await expect(status).toHaveCount(1)
    await expect(status).toHaveAttribute('aria-live', 'polite')
    await expect(status).toHaveText('')

    await page.getByRole('button', { name: 'ID', exact: true }).click()
    await fillContact(page)
    await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
    await expect(status).toContainText('Pesan Terkirim!')
    await expect(status).toContainText('Terima kasih')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('success is not claimed unless Web3Forms confirms it', async ({ page }) => {
    const replies = [
      { status: 200, body: { success: false, message: 'Invalid access key' } },
      { status: 200, body: 'not json' },
      { status: 500, body: { success: false } },
    ]
    let index = 0
    const calls = await mockWeb3Forms(page, () => replies[index])
    await page.goto('/#contact')
    for (index = 0; index < replies.length; index += 1) {
      await fillContact(page, `Disposable message ${index}`)
      await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
      await expect(page.getByRole('alert')).toContainText('something went wrong')
      await expect(page.getByRole('status')).toHaveText('')
      await expect(page.locator('#name')).toHaveValue('Test User')
    }
    expect(calls.count).toBe(replies.length)
  })

  test('keyboard focus moves to the confirmation and back to the form', async ({ page }) => {
    await mockWeb3Forms(page)
    await page.goto('/#contact')
    await fillContact(page)
    await page.locator('#message').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeFocused()
    await page.keyboard.press('Enter')

    const confirmation = page.locator('.success-message')
    await expect(confirmation).toBeFocused()
    await expect(confirmation).toHaveAttribute('tabindex', '-1')
    // When the form returns, focus lands on its first field instead of the page body.
    await expect(page.locator('#name')).toBeFocused({ timeout: 8000 })
    await expect(page.locator('#name')).toHaveValue('')
  })
})

// These checks compare with booleans on purpose: if a real key ever reached
// the test build, a failure message must not print it.
test.describe('test build credentials', () => {
  test('the served bundle contains the placeholder Web3Forms key', async ({ page }, testInfo) => {
    annotate(testInfo, { endpoint: 'GET /assets/*.js (test build)', expected: 'Placeholder key compiled in', risk: 'Medium — tests depend on, or leak, a real key', root_cause: 'Test build reading .env.local' })
    await page.goto('/')
    const scripts = await page.locator('script[type="module"][src]').evaluateAll(tags => tags.map(tag => tag.getAttribute('src')))
    expect(scripts.length).toBeGreaterThan(0)
    let found = false
    for (const src of scripts) {
      const source = await (await page.request.get(src)).text()
      if (source.includes(TEST_WEB3FORMS_ACCESS_KEY)) found = true
    }
    expect(found, 'test build must be compiled with the placeholder key').toBe(true)
  })

  test('the contact form sends the placeholder key, so no real key is needed', async ({ page }) => {
    let sentPlaceholder = null
    await page.route('https://api.web3forms.com/**', route => {
      sentPlaceholder = route.request().postDataJSON()?.access_key === TEST_WEB3FORMS_ACCESS_KEY
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    })
    await page.goto('/#contact')
    await fillContact(page)
    await page.locator('form.contact-form').evaluate(form => form.requestSubmit())
    await expect(page.getByRole('status')).toContainText('Message sent!')
    expect(sentPlaceholder, 'request must carry the placeholder key').toBe(true)
  })

  test('the placeholder key is only wired into the test configuration', () => {
    const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
    // Production code reads the key from the environment and has no fallback.
    const app = read('../../src/App.vue')
    expect(app).toContain('import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;')
    for (const path of ['../../src/App.vue', '../../vite.config.js', '../../package.json', '../../vercel.json', '../../.env.example']) {
      expect(read(path).includes(TEST_WEB3FORMS_ACCESS_KEY), path).toBe(false)
    }
    expect(read('../../playwright.config.js')).toContain('env: { VITE_WEB3FORMS_ACCESS_KEY: TEST_WEB3FORMS_ACCESS_KEY }')
  })
})

test('text fields show the shared keyboard focus outline', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET /#contact', expected: '3px outline on focused inputs and textarea', risk: 'Low — keyboard users lose their place', root_cause: 'Component outline reset overriding :focus-visible' })
  await page.goto('/#contact')
  const outline = locator => locator.evaluate(element => {
    const style = getComputedStyle(element)
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor }
  })
  const expected = { style: 'solid', width: '3px', color: 'rgb(165, 180, 252)' }

  await page.locator('#name').focus()
  expect(await outline(page.locator('#name'))).toEqual(expected)
  await page.keyboard.press('Tab')
  await expect(page.locator('#email')).toBeFocused()
  expect(await outline(page.locator('#email'))).toEqual(expected)
  await page.keyboard.press('Tab')
  await expect(page.locator('#message')).toBeFocused()
  expect(await outline(page.locator('#message'))).toEqual(expected)
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('#email')).toBeFocused()
  // The honeypot is never a tab stop.
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('#name')).toBeFocused()
})
