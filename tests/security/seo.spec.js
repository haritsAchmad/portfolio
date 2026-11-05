import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { ANALYTICS_HOSTS } from '../../src/analytics.js'

const SITE = 'https://portfolio-pied-ten-84.vercel.app/'
const META = {
  en: {
    lang: 'en',
    title: 'Harits Achmad Fauzan | Software Developer',
    description: 'Harits Achmad Fauzan is a software developer who builds and maintains internal web applications, REST APIs, and database workflows with Go, PHP, and PostgreSQL. Open to full-time roles and independent IT projects.',
  },
  id: {
    lang: 'id',
    title: 'Harits Achmad Fauzan | Pengembang Perangkat Lunak',
    description: 'Harits Achmad Fauzan adalah pengembang perangkat lunak yang membangun dan memelihara aplikasi web internal, REST API, dan alur kerja database dengan Go, PHP, dan PostgreSQL. Terbuka untuk posisi full-time dan proyek IT independen.',
  },
}

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

const expectDocumentMeta = async (page, meta) => {
  await expect(page.locator('html')).toHaveAttribute('lang', meta.lang)
  await expect(page).toHaveTitle(meta.title)
  const descriptions = page.locator('meta[name="description"]')
  await expect(descriptions).toHaveCount(1)
  await expect(descriptions).toHaveAttribute('content', meta.description)
  await expect(page.locator('title')).toHaveCount(1)
}

test('language switch updates html lang, title, and description without duplicates', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / + EN/ID switch', expected: 'lang, title, description follow the active language', risk: 'Low — wrong language metadata', root_cause: 'Metadata not tied to i18n' })
  await page.goto('/')
  await expectDocumentMeta(page, META.en)
  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expectDocumentMeta(page, META.id)
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expectDocumentMeta(page, META.en)
})

test('description is a natural sentence of reasonable length in both languages', () => {
  for (const meta of Object.values(META)) {
    expect(meta.description.length).toBeGreaterThan(80)
    expect(meta.description.length).toBeLessThan(260)
    // No repeated keyword stuffing.
    const words = meta.description.toLowerCase().match(/[a-z]+/g)
    const counts = words.reduce((all, word) => ({ ...all, [word]: (all[word] || 0) + 1 }), {})
    for (const [word, count] of Object.entries(counts)) if (word.length > 4) expect(count, word).toBeLessThanOrEqual(2)
    expect(meta.description).not.toMatch(/agency|company|perusahaan|client|klien|years of experience/i)
  }
})

test('canonical, Open Graph, and Twitter metadata are present and consistent', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / <head>', expected: 'One canonical on the production URL; OG/Twitter text tags', risk: 'Low — wrong share preview or canonical', root_cause: 'Guessed or preview-only URL' })
  await page.goto('/')
  const canonical = page.locator('link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  await expect(canonical).toHaveAttribute('href', SITE)
  // The canonical host is the production host the repository already uses.
  expect([...ANALYTICS_HOSTS]).toEqual([new URL(SITE).hostname])

  const og = name => page.locator(`meta[property="og:${name}"]`)
  const tw = name => page.locator(`meta[name="twitter:${name}"]`)
  await expect(og('type')).toHaveAttribute('content', 'website')
  await expect(og('site_name')).toHaveAttribute('content', 'Harits Achmad Fauzan')
  await expect(og('title')).toHaveAttribute('content', META.en.title)
  await expect(og('url')).toHaveAttribute('content', SITE)
  await expect(og('locale')).toHaveAttribute('content', 'en_US')
  await expect(og('locale:alternate')).toHaveAttribute('content', 'id_ID')
  await expect(tw('card')).toHaveAttribute('content', 'summary')
  await expect(tw('title')).toHaveAttribute('content', META.en.title)
  for (const locator of [og('description'), tw('description')]) {
    await expect(locator).toHaveCount(1)
    await expect(locator).toHaveAttribute('content', /Open to full-time roles and independent IT projects\.$/)
  }

  // A preview image is added only when an approved asset exists; if one is
  // present it must be an absolute production URL served by this build.
  for (const locator of [og('image'), tw('image')]) {
    const urls = await locator.evaluateAll(tags => tags.map(tag => tag.getAttribute('content')))
    for (const url of urls) {
      const parsed = new URL(url)
      expect(`${parsed.origin}/`).toBe(SITE)
      const response = await page.request.get(parsed.pathname)
      expect(response.status(), url).toBe(200)
      expect(response.headers()['content-type'], url).toMatch(/^image\//)
    }
  }
})

test('social preview image is the unmodified profile photo on the canonical domain', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / <head> + /profile-preview.jpeg', expected: 'One OG and one Twitter image, same HTTPS canonical URL, with alt text', risk: 'Low — broken or misleading share preview', root_cause: 'Hashed asset URL or guessed image' })
  const IMAGE = `${SITE}profile-preview.jpeg`
  const ALT = 'Photo of Harits Achmad Fauzan'
  await page.goto('/')

  const tags = {
    ogImage: page.locator('meta[property="og:image"]'),
    ogAlt: page.locator('meta[property="og:image:alt"]'),
    twImage: page.locator('meta[name="twitter:image"]'),
    twAlt: page.locator('meta[name="twitter:image:alt"]'),
  }
  for (const locator of Object.values(tags)) await expect(locator).toHaveCount(1)
  await expect(tags.ogImage).toHaveAttribute('content', IMAGE)
  await expect(tags.twImage).toHaveAttribute('content', IMAGE)
  await expect(tags.ogAlt).toHaveAttribute('content', ALT)
  await expect(tags.twAlt).toHaveAttribute('content', ALT)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')
  // No other image metadata variants (og:image:url, og:image:secure_url, twitter:image:src, ...).
  const imageTags = await page.locator('meta[property^="og:image"], meta[name^="twitter:image"]').count()
  expect(imageTags).toBe(4)

  const url = new URL(IMAGE)
  expect(url.protocol).toBe('https:')
  expect(url.hostname).toBe(new URL(SITE).hostname)

  // The build serves the exact bytes of the source photo, unchanged.
  const source = fs.readFileSync(new URL('../../src/assets/harits_photo.jpeg', import.meta.url))
  const built = fs.readFileSync(new URL('../../dist/profile-preview.jpeg', import.meta.url))
  expect(built.equals(source)).toBe(true)
  const response = await page.request.get(url.pathname)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^image\/jpeg/)
  expect(Buffer.from(await response.body()).equals(source)).toBe(true)
})

test('robots.txt allows the public page and points to the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  const text = await response.text()
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  expect(lines).toContain('User-agent: *')
  expect(lines).toContain('Allow: /')
  expect(lines).toContain(`Sitemap: ${SITE}sitemap.xml`)
  // Only the API is excluded; pages, scripts, styles, and images stay crawlable.
  expect(lines.filter(line => line.startsWith('Disallow:'))).toEqual(['Disallow: /api/'])
})

test('sitemap.xml lists only the canonical page', async ({ page, request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()
  await page.goto('/')
  const parsed = await page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'application/xml')
    return {
      error: doc.getElementsByTagName('parsererror').length,
      namespace: doc.documentElement.namespaceURI,
      root: doc.documentElement.localName,
      locs: [...doc.getElementsByTagNameNS('http://www.sitemaps.org/schemas/sitemap/0.9', 'loc')].map(loc => loc.textContent.trim()),
    }
  }, xml)
  expect(parsed).toEqual({ error: 0, namespace: 'http://www.sitemaps.org/schemas/sitemap/0.9', root: 'urlset', locs: [SITE] })
})

test('JSON-LD describes only the person and website shown on the page', async ({ page }, testInfo) => {
  annotate(testInfo, { endpoint: 'GET / JSON-LD', expected: 'Person + WebSite with on-page facts only', risk: 'Medium — fabricated identity or business claims', root_cause: 'Invented schema fields' })
  await page.goto('/')
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(blocks).toHaveLength(1)
  const data = JSON.parse(blocks[0])
  expect(data['@context']).toBe('https://schema.org')
  const types = data['@graph'].map(node => node['@type'])
  expect(types).toEqual(['Person', 'WebSite'])

  const raw = blocks[0]
  for (const forbidden of ['Organization', 'ProfessionalService', 'LocalBusiness', 'aggregateRating', 'review', 'address', 'telephone', 'email', 'worksFor', 'founder', 'image', 'priceRange']) {
    expect(raw, forbidden).not.toContain(`"${forbidden}`)
  }

  const [person, website] = data['@graph']
  expect(person.name).toBe('Harits Achmad Fauzan')
  expect(person.url).toBe(SITE)
  expect(website.url).toBe(SITE)
  expect(website.author['@id']).toBe(person['@id'])
  expect(website.inLanguage).toEqual(['en', 'id'])

  // Every fact must already be visible on the page.
  const body = await page.locator('body').innerText()
  expect(body).toContain(person.alumniOf.name)
  expect(body.toLowerCase()).toContain(person.jobTitle.toLowerCase())
  for (const skill of person.knowsAbout) expect(body, skill).toContain(skill)
  const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href))
  for (const profile of person.sameAs) expect(links, profile).toContain(profile)
})

test('static index.html metadata matches the English i18n values', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  expect(html).toContain(`<title>${META.en.title}</title>`)
  expect(html).toContain(`<meta name="description" content="${META.en.description}" />`)
  expect(html.match(/<link rel="canonical"/g)).toHaveLength(1)
  expect(html.match(/<meta name="description"/g)).toHaveLength(1)
  const i18n = fs.readFileSync(new URL('../../src/i18n.js', import.meta.url), 'utf8')
  for (const meta of Object.values(META)) {
    expect(i18n).toContain(`title: "${meta.title}"`)
    expect(i18n).toContain(`description: "${meta.description}"`)
  }
})
