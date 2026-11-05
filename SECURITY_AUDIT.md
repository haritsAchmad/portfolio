# Portfolio security audit

Audit date: 2026-08-01 (Asia/Jakarta)

## Scope inventory

- Public route: `/`, with anchors `#hero`, `#about`, `#projects`, and `#contact`.
- API: `POST /api/analytics`; deployed `GET` returns 405.
- Contact form: direct browser POST to Web3Forms.
- Download: `/Harits_Achmad_Fauzan_Resume.pdf` is intentionally public.
- Dynamic content: static project objects rendered with escaped Vue interpolation; no `v-html`.
- External links: GitHub, LinkedIn, Instagram, email, and telephone.
- Authentication/private routes/roles/resource-by-ID endpoints: none.

## Confirmed findings

1. **Medium — contact limits and abuse controls (remediated).** Name/message lacked maximum lengths, message was optional, and repeat submissions had no client guard. Required/max-length constraints, unsafe-markup rejection, a honeypot, a 30-second browser cooldown, and tests were added.
2. **Medium — browser security headers (remediated in deployment config).** Production had HSTS but no CSP, anti-framing, nosniff, referrer, or permissions policy. `vercel.json` now supplies them; verify after deployment.
3. **Medium — non-reproducible install (remediated).** The lockfile omitted two runtime dependencies, so `npm ci` failed. It is now synchronized and includes Playwright.
4. **Dependency advisory.** Initial audit reported high-severity PostCSS source-map path traversal. A current PostCSS version is now pinned; the final audit result is recorded during verification.
5. **Low — permissive CORS on public HTML (platform behavior).** Production returned `Access-Control-Allow-Origin: *`. The route contains no credentialed/private data, so this is not currently an access bypass.

## Passed checks

- Chromium and Firefox rendered the public page without runtime errors.
- Query-string script payload did not execute; project content is text-interpolated.
- All new-tab external links used `noopener noreferrer` and expected HTTPS hosts.
- CV returned a PDF; `.env`, `.git/config`, `package.json`, missing PDF, `/admin`, and unknown paths returned 404 in production.
- Desktop and 375px mobile probes had no horizontal overflow before changes.

## Limitations

- Web3Forms requests are intercepted in automation; no production inbox or quota is touched.
- Analytics is invoked directly without `DATABASE_URL`; no production database write occurs.
- New Vercel headers require post-deployment verification.
- Client cooldown/honeypot cannot stop direct third-party API callers. Durable rate limiting needs a controlled backend proxy or provider protection.

## False positives / not applicable

- Private navigation, unauthorized roles, logout replay, expired sessions, and ID replacement are not applicable because the portfolio has no authentication, private route, role, or ID endpoint.
- Wildcard CORS on immutable public HTML is not sensitive-data leakage by itself.
- PostCSS affects build/source-map processing; exploitation of the deployed static output was not demonstrated.

## Optional hardening

- Proxy contact submission through a same-origin serverless endpoint with durable rate limiting and bot verification.
- Add a post-deployment smoke job for Vercel headers.
- Enable dependency review/Dependabot and define an audit severity policy in CI.
- Replace CSP `unsafe-inline` with hashes/nonces if future build output supports it.

## Analytics Privacy — 2026-11-04

Scope: the first-party page-view analytics in `src/analytics.js` (browser) and `api/analytics.js` (Vercel function writing to the `analytics_events` table). Vercel Web Analytics (`inject()` from `@vercel/analytics`) is a separate provider feature and is not covered by these changes.

### Data collected and stored for new events

| Column | Stored value |
| --- | --- |
| `event_name` | Always `page_view`; every other event name is rejected with 400. |
| `path` | The page path, starting with `/`, at most 255 characters, with query string and fragment removed. Control characters are rejected. |
| `visitor_id` | Always `NULL` for new events. The column is kept only for schema compatibility. |
| `session_id` | A random ID kept in `sessionStorage` for the current browser session (8–64 letters, digits, or hyphens), otherwise `NULL`. |
| `referrer` | The origin of the referring page (for example `https://www.google.com`), only for `http:`/`https:` URLs, otherwise `NULL`. |
| `metadata` | At most `{ "device": "mobile" \| "desktop", "language": "<2–3 letter primary code>" }`. Every other key is dropped. |

### Data no longer collected

- A permanent visitor ID in `localStorage` (`portfolio_visitor_id`).
- The full referrer URL, including path and query string.
- Timezone.
- Exact screen width and height.
- The full browser locale (for example `id-ID`); only the primary language (`id`) remains.
- The unused `github_click`, `linkedin_click`, and `resume_download` event names.

### Implementation

- **Session-scoped identifier.** The browser generates a random ID (`crypto.randomUUID()` where available) and stores it in `sessionStorage`, which is scoped to one browser tab and cleared when that tab is closed. It is not written to `localStorage` or cookies.
- **Removal of the previous persistent ID.** On every page load, on every host, the browser removes `portfolio_visitor_id` from `localStorage` before any analytics request is made.
- **Server-side sanitization and allowlisting.** `sanitizeEvent()` builds the row from an allowlist instead of storing client input, so older cached bundles that still send a visitor ID, full referrer, timezone, or screen size are reduced to the fields above. Raw or arbitrary `metadata` is never stored.
- **Payload limit.** Requests whose declared `Content-Length` or actual body exceeds 2048 bytes receive HTTP 413 before parsing. Malformed JSON, arrays, `null`, unknown events, and invalid paths receive HTTP 400. All validation happens before any database connection.
- **Errors.** Database failures return a generic HTTP 500 body; only the error message is logged on the server.
- **Tests.** `tests/security/analytics.privacy.spec.js` covers legacy payloads, eleven malformed or disallowed request types, allowlist enforcement, generic error responses, the browser helpers, removal of the old ID from a real browser, and the privacy notice. Database writes are verified with an in-memory recording client; no real database is used.
- **Privacy notice.** A bilingual notice in the page footer (`#privacy`) describes the collected data, the contact form provider, the hosting/database/font providers, and the lack of automatic deletion.

### Limitations

- **Existing historical database records have not been cleaned.** Rows written before this change may still contain permanent visitor IDs, full referrer URLs, timezone, screen size, and other client-supplied metadata. Cleaning them requires a separate, authorized production database operation.
- **Automatic data retention/deletion is not implemented.** Records are kept until deleted manually.
- **Rate limiting is not implemented.** Anyone can post valid page-view events; the limits above bound the size and shape of each event, not the number of events.
- **Third-party processing.** Hosting (Vercel, including Vercel Web Analytics), the database (Neon), fonts (Google Fonts), and the contact form (Web3Forms) may process visitor information, including IP addresses, independently of this code.
- The session ID still links page views within one browser session, so the data is pseudonymous, not anonymous. These changes reduce collected data; they do not by themselves establish compliance with any privacy regulation.

## Reliability, Accessibility, and Test Readiness — 2026-11-05

Scope: follow-up fixes after the readiness audit of the analytics privacy work, plus local tooling. No change to the analytics payload, the endpoint, the database schema, or Web3Forms.

### Fixed

- **Blocked browser storage.** `localStorage`/`sessionStorage` access in `src/analytics.js` and the contact form in `src/App.vue` is wrapped so a `SecurityError` or quota error cannot break the page. Analytics skips the page view when no session storage is available (no fallback identifier). The contact form keeps its 30-second cooldown in memory, and a failure to store the cooldown no longer turns a sent message into an error.
- **Contact form confirmation.** Success is shown only when Web3Forms answers `{"success": true}`. The confirmation is announced through a `role="status"` live region, keyboard focus moves to it, and focus returns to the first field when the form comes back.
- **Visible focus on form fields.** The component style no longer removes the shared `:focus-visible` outline from inputs and the textarea.
- **Configuration documentation.** `README.md` and `.env.example` document `VITE_WEB3FORMS_ACCESS_KEY` (public, compiled into the bundle) and `DATABASE_URL` (server-only secret) and what stops working without each.
- **Firefox test stability.** Full-suite Firefox timeouts were caused by six parallel browsers recording video; the Firefox project now runs with two workers. No assertion, timeout, or retry was relaxed.
- **Tests without real credentials.** The Playwright build receives a placeholder Web3Forms key through `webServer.env` (`tests/security/test-env.js`); every test that submits the form intercepts the request. Tests pass without `.env.local`, and a normal build does not contain the placeholder.

Tests: `tests/security/reliability.spec.js` (blocked storage, confirmation semantics, focus outline, placeholder key). Full suite: 177 checks across Chromium desktop, Firefox desktop, and Chromium mobile.

### Local analytics backup (optional tooling)

`scripts/analytics-backup/` archives `analytics_events` to CSV files on the owner's computer. It is not part of the website and is not enabled by default. It requires a separate read-only database role and refuses roles that can write, stores the password with Windows DPAPI, never logs credentials, and never deletes or rewrites archived rows. See `docs/ANALYTICS-BACKUP.md` for setup, recovery, and its own limitations.

### Still open

- **Rate limiting** of `/api/analytics` is not implemented. Preferred option: a Vercel WAF rate-limit rule on the endpoint (plan availability not yet verified); fallback: a per-day cap in the database.
- **Automatic retention** is not implemented in the database or for local backup archives; records are kept until deleted manually.
- **Privacy notice** must be updated before the local backup is scheduled, because it adds a storage location (the owner's computer).
