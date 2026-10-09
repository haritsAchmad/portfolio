import { expect, test } from '@playwright/test'
import { projects } from '../../src/data/projects.js'

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

test('public page has no common secret markers', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET /', expected: '200 without credentials/private keys', risk: 'High — public secret disclosure', root_cause: 'Secret bundled into public frontend' })
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(await page.locator('body').innerText()).not.toMatch(/DATABASE_URL|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|change-me-jwt/i)
})

test('query and project data cannot execute markup', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET /?q=<script>… and /#projects', expected: 'No script execution', risk: 'High — XSS', root_cause: 'Unsafe HTML or query interpolation' })
  const queryPayload = '<script>window.__portfolioXss=1</script><img src=x onerror="window.__portfolioXss=1">'
  const queryUrl = `/?q=${encodeURIComponent(queryPayload)}`
  expect(projects.length).toBeGreaterThan(0)

  await test.step('query payload cannot execute', async () => {
    await page.goto(queryUrl)
    // The initial "all" filter must render every project in the application data.
    await expect(page.locator('.project-card')).toHaveCount(projects.length)
    expect(await page.evaluate(() => window.__portfolioXss || 0)).toBe(0)
  })

  await test.step('project title renders malicious markup as literal text', async () => {
    const projectPayload = '<script>window.__portfolioXss=1</script><img src=x onerror="window.__portfolioXss=1">'
    const originalTitle = JSON.stringify(projects[0].title)
    // Replace only a data string in the locally served bundle, preserving the
    // real Vue rendering code. This exercises interpolation, not DOM textContent.
    await page.route('**/assets/*.js', async route => {
      const response = await route.fetch()
      const source = await response.text()
      expect(source).toContain(originalTitle)
      const body = source.split(originalTitle).join(JSON.stringify(projectPayload))
      await route.fulfill({ response, body })
    })
    await page.reload()
    await expect(page.locator('.project-card')).toHaveCount(projects.length)
    await expect(page.locator('.project-title').filter({ hasText: projectPayload })).toHaveCount(1)
    await expect(page.locator('.project-title').filter({ hasText: projectPayload })).toHaveText(projectPayload)
    await expect(page.locator('.project-title script, .project-title img')).toHaveCount(0)
    expect(await page.evaluate(() => window.__portfolioXss || 0)).toBe(0)
  })
})

test('contact validation covers required, format, length, markup, repeat, and errors', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'POST Web3Forms (intercepted)', expected: 'Reject invalid/unsafe/repeated input and show errors', risk: 'Medium — spam or unsafe content', root_cause: 'Missing constraints or cooldown' })
  let submissions = 0
  let status = 200
  await page.route('https://api.web3forms.com/**', route => {
    submissions += 1
    return route.fulfill({ status, contentType: 'application/json', body: '{}' })
  })
  await page.goto('/#contact')
  const name = page.locator('#name')
  const email = page.locator('#email')
  const message = page.locator('#message')
  await expect(name).toHaveAttribute('maxlength', '100')
  await expect(email).toHaveAttribute('maxlength', '254')
  await expect(message).toHaveAttribute('maxlength', '2000')
  await expect(message).toHaveAttribute('required', '')

  await name.fill('Test User')
  await email.fill('not-an-email')
  await message.fill('Hello')
  await page.locator('form').evaluate(form => form.requestSubmit())
  expect(submissions).toBe(0)

  await email.fill('security@example.test')
  await message.fill('<script>alert(1)</script>')
  await page.locator('form').evaluate(form => form.requestSubmit())
  await expect(page.getByRole('alert')).toContainText('tidak diizinkan')
  expect(submissions).toBe(0)

  status = 500
  await message.fill('Safe disposable test message')
  await page.locator('form').evaluate(form => form.requestSubmit())
  await expect(page.getByRole('alert')).toContainText('gangguan')
  status = 200
  await page.locator('form').evaluate(form => form.requestSubmit())
  await expect(page.getByText('Message sent!')).toBeVisible()

  await page.reload()
  await name.fill('Test User')
  await email.fill('security@example.test')
  await message.fill('Second message')
  await page.locator('form').evaluate(form => form.requestSubmit())
  await expect(page.getByRole('alert')).toContainText('30 detik')
  expect(submissions).toBe(2)
})

test('CV is intended PDF and sensitive paths are absent', async ({ request }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET CV and sensitive paths', expected: 'PDF; traversal/env/git/manifest/unknown routes 404', risk: 'High — internal file disclosure', root_cause: 'Unsafe static hosting/path normalization' })
  const cv = await request.get('/Harits_Achmad_Fauzan_Resume.pdf')
  expect(cv.status()).toBe(200)
  expect(cv.headers()['content-type']).toContain('application/pdf')
  expect((await cv.body()).subarray(0, 5).toString()).toBe('%PDF-')
  expect((await request.get('/missing.pdf')).status()).toBe(404)
  for (const path of ['/admin', '/login', '/.env', '/.git/config', '/package.json', '/..%2f.env']) {
    const response = await request.get(path)
    const body = await response.text()
    expect(body, path).not.toMatch(/DATABASE_URL=|\[core\]|"dependencies"\s*:|type=["']password["']|admin dashboard/i)
    if (response.status() === 200) expect(response.headers()['content-type'], path).toContain('text/html')
    else expect(response.status(), path).toBe(404)
  }
})

test('external links use expected HTTPS targets and safe rel', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'External links on /', expected: 'Allowlisted HTTPS and noopener noreferrer', risk: 'Medium — tabnabbing', root_cause: 'Unsafe href or missing rel' })
  await page.goto('/')
  await expect(page.locator('.project-card')).toHaveCount(projects.length)
  const pageOrigin = new URL(page.url()).origin
  const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => ({
    href: element.href, target: element.target, rel: element.rel.split(/\s+/),
  })))
  const allowed = new Set(['github.com', 'www.linkedin.com', 'www.instagram.com'])
  const webProtocols = new Set(['http:', 'https:'])
  const externalLinks = links.filter(link => {
    const url = new URL(link.href)
    return webProtocols.has(url.protocol) && url.origin !== pageOrigin
  })
  expect(externalLinks.length).toBeGreaterThan(0)
  for (const link of links) {
    const url = new URL(link.href)
    // Permit intended email/telephone actions, but reject executable schemes.
    expect(['http:', 'https:', 'mailto:', 'tel:'], link.href).toContain(url.protocol)
    if (webProtocols.has(url.protocol) && url.origin !== pageOrigin) {
      expect(url.protocol, link.href).toBe('https:')
      expect(allowed.has(url.hostname), link.href).toBeTruthy()
    }
    // Every new-tab link needs these protections, including local certificates.
    if (link.target.toLowerCase() === '_blank') {
      expect(webProtocols.has(url.protocol), link.href).toBeTruthy()
      expect(link.rel, link.href).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
    }
  }
})

test('navigation and very long text do not overflow', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / responsive viewport', expected: 'No horizontal overflow; anchors exist', risk: 'Low — unreachable controls', root_cause: 'Fixed-width or unbroken content' })
  await page.goto('/')
  await page.locator('.project-title').first().evaluate(element => { element.textContent = 'A'.repeat(500) })
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(size.scroll).toBe(size.client)
  for (const target of ['#hero', '#about', '#projects', '#contact']) await expect(page.locator(target)).toHaveCount(1)
})
