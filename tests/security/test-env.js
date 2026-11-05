// Placeholder Web3Forms key used only by the Playwright test build.
// playwright.config.js passes it to `vite build` through webServer.env. Vite
// gives VITE_* variables already in process.env priority over .env files, so
// the test build never needs (or picks up) a real key from .env.local, and the
// production build is unchanged. Every test that submits the form intercepts
// https://api.web3forms.com, so this value is never sent anywhere.
export const TEST_WEB3FORMS_ACCESS_KEY = 'playwright-test-only-not-a-web3forms-key'
