# Lanka Offers Web

Consumer web app for discovering Sri Lankan bank card offers. Next.js 16 (App Router), React 19, Tailwind CSS 4, Leaflet for the nearby map. English, Sinhala and Tamil.

## Runtime

Next.js is the only runtime (`next dev` / `next start`, port 5173). The earlier Vite/React Router app was replaced in the Next.js migration; no Vite or React Router code remains.

- `src/app/*` - routes (thin wrappers) and `layout.tsx` (fonts, providers, header/footer).
- `src/views/*` - page implementations used by the routes.
- `src/components/shared/*` - offer card, discount label, bank badge, states; `components/ui/*` - the shadcn primitives actually in use.
- `src/services/api/*` - the only place that talks to the public API (timeouts, abort, typed errors, paging).
- `src/lib/offers.ts` - offer semantics (discount wording, Colombo-time expiry, location labels); `src/lib/banks.ts` - the ten supported banks.
- `src/i18n/{en,si,ta}.json` - translations. Every `t()` key must exist in `en.json`; `si`/`ta` must have the same keys.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public API origin. Unset: same-origin `/api/*`, rewritten to `https://api.lanka-offers.me`. Legacy `VITE_API_BASE_URL` is still read. |
| `NEXT_PUBLIC_MAP_TILE_URL` | OpenStreetMap-format tile URL (legacy `VITE_MAP_TILE_URL` still read). |

## Commands

`npm run typecheck`, `npm run build`, `npm start`, `npm run test:e2e`.

## Offer semantics

- The API returns one `discount_percentage` and no "up to" flag. "Up to N%" is shown only when the bank's own title/description says "up to N%" for that same figure; otherwise the offer shows "N% off".
- An offer is valid through the whole of its `valid_to` day, Sri Lanka time.
- Nearby results come from the API's confirmed branch coordinates; online and nationwide offers are not placed on the map.
- The API supports bank/category/search filtering and paging (max 500). Card-type filtering and sorting run client-side over the complete result set.

## End-to-end tests

`npm run test:e2e` runs Playwright (`tests/e2e/`) against a production build served from `.next-e2e`. It uses the installed Microsoft Edge (set `E2E_CHANNEL=chrome` for Chrome), so no browser download is needed.

- Every `/api` request is answered from fixtures (`tests/e2e/support.ts`). Map tiles are stubbed and any other external request is blocked and fails the test.
- The e2e build points the API proxy at a dead local port (`scripts/e2e-server.mjs`), so nothing can reach the real API even if a test missed an interception.
- Covered: home, navigation, search, bank and sort filters, offer cards and detail (discount wording, expired, online, island-wide, confirmed branch), nearby (area-only vs confirmed branches, radius, city, denied location, map pins), language switching (Sinhala/Tamil wording, persistence, no overflow at phone width), mobile navigation and filter sheet, error states with retry.
- `@mobile`-tagged tests run in the `mobile` project (Pixel 7 viewport). Run one project with `npx playwright test --project=desktop`.

## Known limitations

- No bank logos: none are licensed in this repo, so banks are identified by name and monogram.
- Sinhala/Tamil strings added in the redesign (see recent `si.json`/`ta.json` changes) need native-speaker review.
- Accessibility is checked structurally (landmarks, skip link, current-page state); no automated contrast or screen-reader audit has been run.
