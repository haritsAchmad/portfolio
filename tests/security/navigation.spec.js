import { expect, test } from '@playwright/test'

const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }
const SECTIONS = ['#hero', '#projects', '#services', '#about', '#certifications', '#contact']

const annotate = (testInfo, values) => {
  for (const [type, description] of Object.entries(values)) testInfo.annotations.push({ type, description })
}

// Located by its stable aria-controls, not its translated name; the names in
// both languages are asserted explicitly in the tests below.
const menuToggle = page => page.locator('button[aria-controls="mobile-menu"]')
const mobileMenu = page => page.locator('#mobile-menu')

test.describe('mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await page.goto('/')
  })

  test('toggle opens and closes the menu and reports its state', async ({ page }, testInfo) => {
    annotate(testInfo, { endpoint: 'GET / at 390px', expected: 'Visible toggle; aria-expanded follows the menu', risk: 'Medium — unreachable navigation on phones', root_cause: 'Links hidden without a replacement menu' })
    const toggle = menuToggle(page)
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-controls', 'mobile-menu')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveAccessibleName('Open navigation menu')
    await expect(mobileMenu(page)).toBeHidden()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(toggle).toHaveAccessibleName('Close navigation menu')
    await expect(mobileMenu(page)).toBeVisible()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(mobileMenu(page)).toBeHidden()
  })

  test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
    const toggle = menuToggle(page)
    await toggle.click()
    await mobileMenu(page).getByRole('link', { name: 'Projects' }).focus()
    await page.keyboard.press('Escape')
    await expect(mobileMenu(page)).toBeHidden()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })

  test('choosing a link closes the menu and scrolls to the section', async ({ page }) => {
    await menuToggle(page).click()
    await mobileMenu(page).getByRole('link', { name: 'Contact' }).click()
    await expect(mobileMenu(page)).toBeHidden()
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(page).toHaveURL(/#contact$/)
    await expect(page.locator('#contact')).toBeInViewport()
  })

  test('menu lists every section and the CV in both languages', async ({ page }) => {
    await menuToggle(page).click()
    const links = mobileMenu(page).getByRole('link')
    await expect(links).toHaveCount(SECTIONS.length + 1)
    for (const [index, target] of SECTIONS.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', target)
      await expect(page.locator(target)).toHaveCount(1)
    }
    await expect(links.last()).toHaveAttribute('download', /\.pdf$/)

    await page.getByRole('button', { name: 'ID', exact: true }).click()
    await expect(menuToggle(page)).toHaveAccessibleName('Tutup menu navigasi')
    await expect(mobileMenu(page).getByRole('link', { name: 'Kontak' })).toBeVisible()

    // The menu closes, reopens, and closes with Escape in Indonesian too.
    await menuToggle(page).click()
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(menuToggle(page)).toHaveAccessibleName('Buka menu navigasi')
    await expect(mobileMenu(page)).toBeHidden()
    await menuToggle(page).click()
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(mobileMenu(page).getByRole('link', { name: 'Unduh CV' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(mobileMenu(page)).toBeHidden()
    await expect(menuToggle(page)).toBeFocused()
  })

  test('menu works from the keyboard alone', async ({ page }) => {
    const toggle = menuToggle(page)
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    // The next Tab stops are the menu links, in order.
    await page.keyboard.press('Tab')
    await expect(mobileMenu(page).getByRole('link').first()).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(mobileMenu(page).getByRole('link', { name: 'Projects' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(mobileMenu(page)).toBeHidden()
    await expect(page).toHaveURL(/#projects$/)

    await toggle.focus()
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('resizing to desktop closes the menu', async ({ page }) => {
    await menuToggle(page).click()
    await expect(mobileMenu(page)).toBeVisible()
    await page.setViewportSize(DESKTOP)
    await expect(mobileMenu(page)).toBeHidden()
    await expect(menuToggle(page)).toBeHidden()
    await page.setViewportSize(MOBILE)
    // The menu stays closed instead of reappearing open.
    await expect(menuToggle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(mobileMenu(page)).toBeHidden()
  })
})

test.describe('desktop navigation', () => {
  test('links are reachable in the navigation landmark and the toggle is hidden', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    for (const [index, name] of ['Home', 'Projects', 'Services', 'Experience', 'Certifications', 'Contact'].entries()) {
      await expect(nav.getByRole('link', { name, exact: true }).first()).toHaveAttribute('href', SECTIONS[index])
    }
    await expect(menuToggle(page)).toBeHidden()
    await expect(nav.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('skip link is the first Tab stop and moves focus to the main content', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })
})
