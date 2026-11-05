import { expect, test } from '@playwright/test'
import { processSteps, services } from '../../src/data/services.js'
import { projects } from '../../src/data/projects.js'
import { CONTACT_EMAIL, WHATSAPP_NUMBER, mailtoUrl, whatsappUrl } from '../../src/contactLinks.js'

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

const WHATSAPP_EN = 'Hello Harits, I found your portfolio and would like to discuss an IT project. My requirements are: '
const WHATSAPP_ID = 'Halo Harits, saya menemukan portofolio Anda dan ingin mendiskusikan proyek IT. Kebutuhan saya adalah: '

const switchLanguage = (page, code) => page.getByRole('button', { name: code, exact: true }).click()

test('service evidence only references existing projects and keeps work types honest', () => {
  const byId = new Map(projects.map(project => [project.id, project]))
  expect(services.map(service => service.key)).toEqual(['web-development', 'maintenance', 'database-api', 'reporting'])
  for (const service of services) {
    for (const lang of ['en', 'id']) {
      expect(service[lang].title, `${service.key} ${lang}`).toBeTruthy()
      expect(service[lang].items.length, `${service.key} ${lang}`).toBeGreaterThan(0)
    }
    expect(service.en.items).toHaveLength(service.id.items.length)
    expect(service.evidence.length).toBeGreaterThan(0)
    for (const item of service.evidence) {
      const project = byId.get(item.project)
      expect(project, `${service.key} -> ${item.project}`).toBeTruthy()
      expect(['professional', 'personal', 'academic']).toContain(project.kind)
      expect(item.en && item.id).toBeTruthy()
    }
  }
  // Import/export is not offered until a project on the site demonstrates it.
  expect(JSON.stringify(services)).not.toMatch(/import|export|impor|ekspor/i)
  expect(processSteps).toHaveLength(4)
})

test('services render in English and Indonesian with evidence labels', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET /#services', expected: 'Four services, evidence links, honesty note, bilingual', risk: 'Low — misleading or untranslated service claims', root_cause: 'Hardcoded or unverified copy' })
  await page.goto('/')
  const section = page.locator('#services')
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('IT Services')
  const cards = section.locator('.service-card')
  await expect(cards).toHaveCount(4)
  for (const [index, service] of services.entries()) {
    await expect(cards.nth(index).getByRole('heading', { level: 3 })).toHaveText(service.en.title)
    await expect(cards.nth(index).getByRole('link')).toHaveCount(service.evidence.length)
  }
  await expect(section).toContainText('not on previous freelance contracts')
  await expect(section).toContainText('Professional project')
  await expect(section).not.toContainText(/testimonial|clients served|\d+\s*%|24\/7/i)

  await switchLanguage(page, 'ID')
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Layanan IT')
  for (const [index, service] of services.entries()) {
    await expect(cards.nth(index).getByRole('heading', { level: 3 })).toHaveText(service.id.title)
  }
  await expect(section).toContainText('bukan dari kontrak freelance sebelumnya')
  await expect(section).toContainText('Proyek profesional')
  await expect(section).not.toContainText(/Web Application Development|What this covers|Related experience/)
})

test('evidence links reveal and focus the project card even when a filter hides it', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'Service evidence -> #project-<id>', expected: 'Filter reset, card in view and focused', risk: 'Low — broken in-page navigation', root_cause: 'Anchor target not rendered under the active filter' })
  // With CSS smooth scrolling, Firefox sometimes received the filter click while
  // the button was still scrolling into view (2 of 3 runs). Reduced motion
  // disables smooth scrolling and also exercises that branch of showProject.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  // Hide the business-systems projects first.
  await page.locator('#projects').getByRole('button', { name: 'AI Experiments' }).click()
  await expect(page.locator('#project-7')).toHaveCount(0)

  await page.locator('[data-service="web-development"]').getByRole('link', { name: 'SI Inventaris SBRC IPB' }).click()
  const card = page.locator('#project-7')
  await expect(card).toBeVisible()
  await expect(card).toBeFocused()
  await expect(card).toBeInViewport()
  await expect(page).toHaveURL(/#project-7$/)
  await expect(page.locator('#projects').getByRole('button', { name: 'All Projects' })).toHaveAttribute('aria-pressed', 'true')

  // Every evidence link points at a card that exists on the page.
  const targets = await page.locator('#services a[href^="#project-"]').evaluateAll(links => links.map(link => link.getAttribute('href')))
  expect(targets.length).toBeGreaterThan(0)
  for (const target of new Set(targets)) await expect(page.locator(target)).toHaveCount(1)
})

test('process explains individual agreements without fixed prices or guarantees', async ({ page }) => {
  await page.goto('/')
  const process = page.locator('#process')
  await expect(process.locator('.process-step')).toHaveCount(4)
  await expect(process.getByRole('heading', { level: 3 })).toHaveText(processSteps.map(step => step.en.title))
  await expect(process).toContainText('agreed individually')
  await expect(process).not.toContainText(/Rp\s?\d|\$\s?\d|guarantee|24\/7/i)
  await switchLanguage(page, 'ID')
  await expect(process.getByRole('heading', { level: 3 })).toHaveText(processSteps.map(step => step.id.title))
  await expect(process).toContainText('disepakati per proyek')
})

test('contact link builders encode the number, subject, and message', () => {
  const wa = new URL(whatsappUrl(WHATSAPP_EN))
  expect(wa.origin).toBe('https://wa.me')
  expect(wa.pathname).toBe(`/${WHATSAPP_NUMBER}`)
  expect(wa.searchParams.get('text')).toBe(WHATSAPP_EN)
  expect(whatsappUrl('a & b = c?')).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=a%20%26%20b%20%3D%20c%3F`)

  const mail = mailtoUrl('Subject & more', 'Line 1\nLine 2')
  expect(mail).toBe(`mailto:${CONTACT_EMAIL}?subject=Subject%20%26%20more&body=Line%201%0ALine%202`)
})

test('WhatsApp and email options follow the selected language in both sections', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'Contact options in #services and #contact', expected: 'Localized wa.me text and mailto subject; safe new-tab link', risk: 'Low — wrong or unsafe external contact links', root_cause: 'Unencoded or untranslated prefilled messages' })
  await page.goto('/')
  const check = async ({ whatsappName, emailName, text, subject, bodyStart }) => {
    for (const scope of ['#services', '#contact']) {
      const region = page.locator(scope)
      const whatsapp = region.getByRole('link', { name: whatsappName })
      const email = region.getByRole('link', { name: emailName })
      await expect(whatsapp).toHaveCount(1)
      await expect(email).toHaveCount(1)

      const wa = new URL(await whatsapp.getAttribute('href'))
      expect(`${wa.origin}${wa.pathname}`).toBe(`https://wa.me/${WHATSAPP_NUMBER}`)
      expect(wa.searchParams.get('text')).toBe(text)
      await expect(whatsapp).toHaveAttribute('target', '_blank')
      await expect(whatsapp).toHaveAttribute('rel', /noopener/)
      await expect(whatsapp).toHaveAttribute('rel', /noreferrer/)

      const href = await email.getAttribute('href')
      expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBeTruthy()
      const params = new URLSearchParams(href.split('?')[1])
      expect(params.get('subject')).toBe(subject)
      expect(params.get('body').startsWith(bodyStart)).toBeTruthy()
      await expect(email).not.toHaveAttribute('target', '_blank')

      // Each option names the external application it opens.
      for (const link of [whatsapp, email]) {
        const hintId = await link.getAttribute('aria-describedby')
        expect(hintId).toBeTruthy()
        await expect(page.locator(`#${hintId}`)).toHaveCount(1)
        await expect(link).toHaveAccessibleDescription(/WhatsApp|email/i)
      }
    }
  }
  await check({ whatsappName: 'Discuss via WhatsApp', emailName: 'Contact via Email', text: WHATSAPP_EN, subject: 'IT Project Inquiry - Portfolio', bodyStart: 'Hello Harits,\n\nI found your portfolio' })
  await switchLanguage(page, 'ID')
  await check({ whatsappName: 'Diskusi via WhatsApp', emailName: 'Hubungi via Email', text: WHATSAPP_ID, subject: 'Diskusi Proyek IT - Portofolio', bodyStart: 'Halo Harits,\n\nSaya menemukan portofolio' })
})

test('contact options are reachable from the keyboard and large enough to tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  for (const scope of ['#services', '#contact']) {
    for (const name of ['Discuss via WhatsApp', 'Contact via Email']) {
      const link = page.locator(scope).getByRole('link', { name })
      await link.focus()
      await expect(link).toBeFocused()
      const box = await link.boundingBox()
      expect(box.height, `${scope} ${name}`).toBeGreaterThanOrEqual(44)
    }
  }
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(size.scroll).toBe(size.client)
})

test('hero offers work and services while keeping CV and GitHub', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('#hero')
  await expect(hero).toContainText('Open to full-time roles & freelance projects')
  await expect(hero.getByRole('link', { name: 'View My Work' })).toHaveAttribute('href', '#projects')
  await expect(hero.getByRole('link', { name: 'Explore IT Services' })).toHaveAttribute('href', '#services')
  await expect(hero.getByRole('link', { name: 'Download CV (PDF)' })).toHaveAttribute('download', /\.pdf$/)
  await expect(hero.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/haritsAchmad')

  await hero.getByRole('link', { name: 'Explore IT Services' }).click()
  await expect(page.locator('#services')).toBeInViewport()

  await switchLanguage(page, 'ID')
  await expect(hero).toContainText('Terbuka untuk posisi full-time & proyek freelance')
  await expect(hero.getByRole('link', { name: 'Jelajahi Layanan IT' })).toHaveAttribute('href', '#services')
})

test('public pages do not reveal exact legacy versions of former employer systems', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#projects .project-card')).toHaveCount(projects.length)
  const text = await page.locator('body').innerText()
  expect(text).not.toMatch(/PHP 5\.3|PostgreSQL 8\.3|Symfony 1\b|compatible with PHP 7\.4/)
  await expect(page.locator('#project-5')).toContainText('Source code confidential')
})

test('services are positioned as personal, independent work with stated limits', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET /#services', expected: 'Personal positioning and per-service limits in EN and ID', risk: 'Low — implying a team, company, or unlimited service', root_cause: 'Agency-style or unbounded service copy' })
  await page.goto('/')
  const section = page.locator('#services')
  await expect(section).toContainText('work on each project independently')
  await expect(section).toContainText('I do not have a team or a company')
  await expect(section).toContainText('discussed and agreed with you first')
  await expect(section).not.toContainText(/our team|our company|agency|software house|\bSLA\b|24\/7|unlimited/i)
  const cards = section.locator('.service-card')
  for (const [index, service] of services.entries()) {
    await expect(cards.nth(index).locator('.service-limits')).toHaveText(`Good to know: ${service.en.limits}`)
  }
  await expect(cards.nth(1)).toContainText('permission from the system owner')
  await expect(cards.nth(2)).toContainText('verified backup')
  await expect(cards.nth(2)).toContainText('documentation, credentials, and access permission')

  await switchLanguage(page, 'ID')
  await expect(section).toContainText('mengerjakan setiap proyek secara independen')
  await expect(section).toContainText('Saya tidak memiliki tim atau perusahaan')
  for (const [index, service] of services.entries()) {
    await expect(cards.nth(index).locator('.service-limits')).toHaveText(`Perlu diketahui: ${service.id.limits}`)
  }
  await expect(section).not.toContainText('Good to know')
})

test('every project starts with an initial discussion, in both languages', async ({ page }) => {
  await page.goto('/')
  const process = page.locator('#process')
  await expect(process.locator('.process-consultation')).toHaveText('Every project starts with an initial discussion to understand the requirements, technical constraints, and expected outcomes before any commitment is made.')
  await expect(process).toContainText('no round-the-clock support or service-level agreement')
  await switchLanguage(page, 'ID')
  await expect(process.locator('.process-consultation')).toHaveText('Setiap proyek dimulai dengan diskusi awal untuk memahami kebutuhan, kendala teknis, dan hasil yang diharapkan sebelum ada komitmen pengerjaan.')
  await expect(process).toContainText('tidak ada dukungan 24 jam atau SLA')
})

test('image alt text follows the active language', async ({ page }) => {
  await page.goto('/')
  const images = page.locator('img')
  const count = await images.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index++) {
    expect((await images.nth(index).getAttribute('alt'))?.trim(), `img ${index}`).toBeTruthy()
  }
  const photo = page.locator('#hero img')
  await expect(photo).toHaveAttribute('alt', 'Photo of Harits Achmad Fauzan')
  await expect(page.locator('#certifications img')).toHaveAttribute('alt', /^BNSP Software Engineer certificate/)
  await switchLanguage(page, 'ID')
  await expect(photo).toHaveAttribute('alt', 'Foto Harits Achmad Fauzan')
  await expect(page.locator('#certifications img')).toHaveAttribute('alt', /^Sertifikat BNSP/)
})

test('each language shows no leftover copy from the other language', async ({ page }) => {
  await page.goto('/')
  const body = page.locator('body')
  await expect(page.locator('#email')).toHaveAttribute('placeholder', 'email@example.com')
  await expect(body).not.toContainText(/Hak cipta|Sarjana Terapan|Modernisasi Legacy|Sistem Bisnis|Selesai · Proyek|sedang dipelajari|Perlu diketahui/)
  await expect(page.locator('#hero img')).not.toHaveAttribute('alt', /^Foto/)

  await switchLanguage(page, 'ID')
  await expect(page.locator('#email')).toHaveAttribute('placeholder', 'email@contoh.com')
  await expect(body).toContainText('Sarjana Terapan Ilmu Komputer')
  await expect(body).toContainText('Hak cipta dilindungi.')
  await expect(body).not.toContainText(/All rights reserved|Bachelor of Applied|Legacy Modernization|Business Systems|Completed · |Active development|Docker \(Learning\)|Good to know|Crafted with/)
})

test('page metadata and heading outline describe the personal portfolio', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Harits Achmad Fauzan | Software Developer')
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toContain('Harits Achmad Fauzan')
  expect(description).toContain('Open to full-time roles and independent IT projects')
  expect(description).not.toMatch(/agency|company|berpengalaman/i)

  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(headings =>
    headings.filter(heading => heading.getClientRects().length > 0).map(heading => Number(heading.tagName[1])))
  expect(levels.filter(level => level === 1)).toHaveLength(1)
  expect(levels[0]).toBe(1)
  for (let index = 1; index < levels.length; index++) {
    expect(levels[index] - levels[index - 1], `heading ${index}`).toBeLessThanOrEqual(1)
  }
})
