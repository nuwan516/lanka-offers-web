import { test, expect, offer } from './support'

test.describe('Offer detail', () => {
  test('shows the discount, caveat, validity, eligibility, terms and the original source', async ({ page }) => {
    await page.goto('/offers/o-upto')
    await expect(page.getByRole('img', { name: 'Oak Ray Colombo City Hotel promotion' })).toBeVisible()

    await expect(page.getByText('Up to 35% off').first()).toBeVisible()
    await expect(page.getByText(/Caps, minimum spend and eligible cards are in the terms/)).toBeVisible()
    await expect(page.getByText('Credit Card').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /View official offer/ })).toHaveAttribute('href', /example-bank\.lk/)
  })

  test('a plain discount is not shown as "up to"', async ({ page }) => {
    await page.goto('/offers/o-plain')

    await expect(page.getByText('30% off').first()).toBeVisible()
    await expect(page.getByText(/Up to 30%/)).toHaveCount(0)
  })

  test('a failed approved image falls back without breaking the offer detail', async ({ page }) => {
    await page.route('**/api/images/**', (route) => route.abort())
    await page.goto('/offers/o-plain')

    await expect(page.getByRole('img', { name: 'Pizza Hut promotion image unavailable' })).toBeVisible()
    await expect(page.getByText('30% off').first()).toBeVisible()
  })

  test('renders the captured BOC Chinese Lotus Lux promotion with its approved image contract', async ({ page, api }) => {
    api.offers.push(
      offer({
        id: 'boc-live-chinese-lotus-lux',
        unique_id: 'boc_chinese-lotus-lux',
        bank: 'boc',
        source_url: 'https://www.boc.lk/personal-banking/card-offers/dining/chinese-lotus-lux/product',
        title: 'Chinese Lotus Lux',
        merchant_name: 'Chinese Lotus Lux',
        category: 'Dining',
        valid_to: '2026-12-31T00:00:00.000Z',
        image_url: `/api/images/${'1364824905a8df819220448da3411668badc002615ca8602eb3569184c1f29b3'}.jpg`,
      })
    )
    await page.goto('/offers/boc-live-chinese-lotus-lux')

    await expect(page.getByRole('heading', { name: 'Chinese Lotus Lux' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Chinese Lotus Lux promotion' })).toBeVisible()
    await expect(page.getByRole('link', { name: /View official offer/ })).toHaveAttribute('href', /boc\.lk/)
  })

  test('@mobile keeps the image frame inside the mobile viewport', async ({ page }) => {
    await page.goto('/offers/o-plain')

    const image = page.getByRole('img', { name: 'Pizza Hut promotion' })
    await expect(image).toBeVisible()
    const box = await image.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(412)
  })

  test('an expired offer says so clearly', async ({ page }) => {
    await page.goto('/offers/o-expired')

    await expect(page.getByRole('status')).toContainText('This offer has expired')
  })

  test('an unknown offer shows a not-found state, not a blank page', async ({ page }) => {
    await page.goto('/offers/does-not-exist')

    await expect(page.getByText('Offer not found').first()).toBeVisible()
  })

  test('online offers say only what the bank says', async ({ page }) => {
    await page.goto('/offers/o-online')

    await expect(page.getByText('The bank lists this as an online offer')).toBeVisible()
    await expect(page.getByText(/website or app/)).toHaveCount(0)
    await expect(page.getByText('Web & App')).toHaveCount(0)
  })

  test('island-wide offers do not claim every outlet takes part', async ({ page }) => {
    await page.goto('/offers/o-nationwide')

    await expect(page.getByText(/does not confirm which outlets take part/)).toBeVisible()
    await expect(page.getByText(/all official branches/i)).toHaveCount(0)
    await expect(page.getByText('All Outlets')).toHaveCount(0)
  })

  test('a confirmed branch is listed with a map link', async ({ page }) => {
    await page.goto('/offers/o-plain')

    await expect(page.getByText('5 Dalada Veediya, Kandy')).toBeVisible()
    await expect(page.getByRole('link', { name: /View on map/i }).first()).toBeVisible()
  })
})

test.describe('Nearby', () => {
  test('lists confirmed branches with distance and area-only offers without one', async ({ page }) => {
    await page.goto('/nearby')

    const branch = page.getByRole('article').filter({ hasText: 'Keells Fort' })
    await expect(branch).toContainText('1.2 km')
    await expect(branch).toContainText('12 Chatham Street')

    const area = page.getByRole('article').filter({ hasText: 'Thai Rasa' })
    await expect(area).toContainText('Area only: Colombo')
    // A city centre is never presented as being "0 m" away.
    await expect(area).not.toContainText('0 m')
    await expect(area).not.toContainText('km')
  })

  test('confirmed branches come first', async ({ page }) => {
    await page.goto('/nearby')
    await expect(page.getByRole('article')).toHaveCount(2)

    const names = await page.getByRole('article').locator('h3').allTextContents()
    expect(names).toEqual(['Keells Fort', 'Thai Rasa'])
  })

  test('changing the radius or city asks the API for that place', async ({ page, api }) => {
    await page.goto('/nearby')

    await page.getByRole('button', { name: 'Kandy' }).click()
    await expect.poll(() =>
      api.requests.some((u) => u.pathname === '/api/offers/nearby' && Math.abs(Number(u.searchParams.get('lat')) - 7.2906) < 0.01)
    ).toBe(true)

    await page.getByRole('button', { name: '50 km' }).click()
    await expect.poll(() =>
      api.requests.some((u) => u.pathname === '/api/offers/nearby' && u.searchParams.get('radius') === '50')
    ).toBe(true)
  })

  test('a denied location permission falls back to the city list with a clear message', async ({ page, context }) => {
    await context.clearPermissions()
    await page.addInitScript(() => {
      // Deterministic denial instead of depending on the browser's permission UI.
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          // Same shape as a real GeolocationPositionError.
          getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) =>
            fail({ code: 1, PERMISSION_DENIED: 1, message: 'denied' }),
          watchPosition: () => 0,
          clearWatch: () => undefined,
        },
        configurable: true,
      })
    })
    await page.goto('/nearby')

    await page.getByRole('button', { name: /Use my location/ }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Location access denied' })).toBeVisible()
    // The manual path still works.
    await page.getByRole('button', { name: 'Galle' }).click()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('the map view only pins confirmed branches', async ({ page }) => {
    await page.goto('/nearby')
    await page.getByRole('button', { name: /View map/ }).click()

    await expect(page.locator('.leaflet-container')).toBeVisible()
    // Two offers returned, one with only a city-centre point: one branch pin plus the user marker.
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2)
  })
})
