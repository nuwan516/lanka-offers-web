import { test as base, expect, type Page, type Route } from '@playwright/test'

/**
 * Deterministic API for the e2e suite. Every /api request is answered here;
 * nothing reaches Neon, the real public API or any other host.
 */

type Json = Record<string, unknown>

const FAR_FUTURE = '2099-12-31T00:00:00.000Z'

export function offer(over: Json = {}): Json {
  return {
    id: 'o-plain',
    unique_id: 'hnb_pizza-hut',
    bank: 'hnb',
    source_url: 'https://www.example-bank.lk/offers/pizza-hut',
    title: 'Pizza Hut – 30% Off – Credit',
    category: 'Dining',
    card_type: 'Credit Card',
    merchant_name: 'Pizza Hut',
    merchant_location: null,
    canonical_merchant: 'Pizza Hut',
    location_scope: 'EXPLICIT_BRANCH',
    discount_percentage: '30',
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_to: FAR_FUTURE,
    card_eligibility: { cardTypes: ['Credit Card'], networks: ['Visa'], includedCards: [], excludedCards: [], restrictions: [] },
    geo_locations: [
      { name: 'Pizza Hut Kandy', address: '5 Dalada Veediya, Kandy', lat: 7.2906, lng: 80.6337, confidence: 0.9 },
    ],
    geo_status: 'resolved',
    db_status: 'PUBLISHED',
    description: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

export const OFFERS: Json[] = [
  offer(),
  offer({
    id: 'o-upto', unique_id: 'boc_oak-ray', bank: 'boc', title: 'Oak Ray Colombo City Hotel – Up to 35% off – Credit',
    category: 'Leisure', merchant_name: 'Oak Ray Colombo City Hotel', discount_percentage: '35',
    geo_locations: [{ name: 'Oak Ray', address: '20 Galle Road, Colombo 3', lat: 6.91, lng: 79.85 }],
  }),
  offer({
    id: 'o-expired', unique_id: 'hnb_old-deal', title: 'Old Deal – 40% Off – Credit', merchant_name: 'Old Deal Cafe',
    discount_percentage: '40', valid_to: '2020-01-01T00:00:00.000Z',
  }),
  offer({
    id: 'o-online', unique_id: 'peoples_daraz', bank: 'peoples', title: 'Daraz – 10% Off – Credit', category: 'Online',
    merchant_name: 'Daraz', discount_percentage: '10', location_scope: 'ONLINE', geo_locations: [], geo_status: null,
  }),
  offer({
    id: 'o-nationwide', unique_id: 'hnb_keells-all', title: 'Keells Supermarket – 5% Off – Credit', category: 'Supermarket',
    merchant_name: 'Keells', discount_percentage: '5', location_scope: 'NATIONWIDE', geo_locations: [], geo_status: null,
  }),
  offer({
    id: 'o-novalue', unique_id: 'peoples_visa', bank: 'peoples', title: 'VISA Offers', merchant_name: 'VISA Offers',
    discount_percentage: null, category: 'Card Offers', geo_locations: [], location_scope: 'UNRESOLVED',
  }),
]

/** Near Colombo: one real branch, one city-centre point the geocoder called "resolved". */
export const NEARBY: Json[] = [
  offer({
    id: 'o-area', unique_id: 'peoples_thai-rasa', bank: 'peoples', title: 'Thai Rasa at NH Collection Colombo – 25% Off – Credit',
    merchant_name: 'Thai Rasa', discount_percentage: '25', distance_km: 0,
    matched_branch_name: 'Colombo, Sri Lanka', matched_branch_address: 'Colombo, Sri Lanka',
    geo_locations: [{ name: 'Colombo, Sri Lanka', address: 'Colombo, Sri Lanka', lat: 6.9270786, lng: 79.861243, confidence: 0.9 }],
  }),
  offer({
    id: 'o-branch', unique_id: 'hnb_keells-fort', title: 'Keells Fort – 15% Off – Credit', merchant_name: 'Keells Fort',
    discount_percentage: '15', distance_km: 1.2,
    matched_branch_name: 'Keells Fort', matched_branch_address: '12 Chatham Street, Colombo 1',
    geo_locations: [{ name: 'Keells Fort', address: '12 Chatham Street, Colombo 1', lat: 6.934, lng: 79.845, confidence: 0.9 }],
  }),
]

export const BANKS = [
  { code: 'hnb', name: 'Hatton National Bank', cardTypesSupported: ['credit', 'debit'], activeOfferCount: 3 },
  { code: 'boc', name: 'Bank of Ceylon', cardTypesSupported: ['credit', 'debit'], activeOfferCount: 1 },
  { code: 'peoples', name: "People's Bank", cardTypesSupported: ['credit', 'debit'], activeOfferCount: 2 },
  { code: 'nsb', name: 'National Savings Bank', cardTypesSupported: ['credit', 'debit'], activeOfferCount: 0 },
  { code: 'sampath', name: 'Sampath Bank', cardTypesSupported: ['credit', 'debit'], activeOfferCount: 0 },
]

export interface ApiState {
  offers: Json[]
  nearby: Json[]
  banks: Json[]
  /** When set, /api/offers fails with this status until cleared. */
  offersStatus: number | null
  requests: URL[]
  external: string[]
}

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

export async function installApi(page: Page, init: Partial<ApiState> = {}): Promise<ApiState> {
  const state: ApiState = {
    offers: OFFERS, nearby: NEARBY, banks: BANKS, offersStatus: null, requests: [], external: [], ...init,
  }
  const origin = `http://127.0.0.1:${process.env.E2E_PORT ?? 5180}`

  // Only API calls and off-site requests are intercepted; the app's own assets are not
  // routed, which keeps page loads fast.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => {
      const url = new URL(route.request().url());
      state.requests.push(url)
      return handleApi(route, url, state)
    }
  )

  await page.route(
    (url) => url.origin !== origin && !url.pathname.startsWith('/api/'),
    (route) => {
      const url = new URL(route.request().url());
      // Map tiles: a blank tile. Anything else off-site is blocked and recorded.
      if (/tile.openstreetmap.org/.test(url.hostname)) {
        return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX })
      }
      state.external.push(url.href)
      return route.abort()
    }
  )
  return state
}

function handleApi(route: Route, url: URL, state: ApiState) {
  const path = url.pathname
  const q = url.searchParams

  if (path === '/api/banks') return fulfillJson(route, state.banks)
  if (path === '/api/merchants') return fulfillJson(route, [])

  if (path === '/api/offers/nearby') {
    return fulfillJson(route, { items: state.nearby, total: state.nearby.length, limit: 100, offset: 0 })
  }

  if (path === '/api/offers') {
    if (state.offersStatus) return fulfillJson(route, { error: 'boom' }, state.offersStatus)
    let items = state.offers
    const bank = q.get('bank')
    const search = q.get('search')?.toLowerCase()
    const scope = q.get('locationScope')
    if (bank) items = items.filter((o) => o.bank === bank.toLowerCase())
    if (scope) items = items.filter((o) => o.location_scope === scope)
    if (search) {
      items = items.filter((o) =>
        [o.title, o.merchant_name, o.canonical_merchant].some((f) => String(f ?? '').toLowerCase().includes(search))
      )
    }
    const limit = Number(q.get('limit') ?? 50)
    const offset = Number(q.get('offset') ?? 0)
    return fulfillJson(route, { items: items.slice(offset, offset + limit), total: items.length, limit, offset })
  }

  const detail = path.match(/^\/api\/offers\/([^/]+)$/)
  if (detail) {
    const id = decodeURIComponent(detail[1])
    const found = [...state.offers, ...state.nearby].find((o) => o.id === id || o.unique_id === id)
    if (!found) return fulfillJson(route, { error: 'Offer not found' }, 404)
    return fulfillJson(route, {
      ...found,
      terms: 'Valid on dine-in only. Prior reservation recommended.',
      raw_offer: { offer: { generalTerms: ['Minimum bill value of Rs.5,000/-'] } },
    })
  }

  return fulfillJson(route, { error: `No fixture for ${path}` }, 404)
}

export const test = base.extend<{ api: ApiState }>({
  // auto: the API is installed for every test, including ones that never mention it,
  // so no test can fall through to a real backend.
  api: [
    async ({ page }, use) => {
      const state = await installApi(page)
      await use(state)
      // Nothing may leave the machine: tiles are stubbed, everything else blocked.
      expect(state.external, 'blocked external requests').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
