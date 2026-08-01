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
