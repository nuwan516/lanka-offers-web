import { test, expect, manyOffers } from './support'

const offersRequests = (api: { requests: URL[] }) => api.requests.filter((u) => u.pathname === '/api/offers')
const offsets = (api: { requests: URL[] }) => offersRequests(api).map((u) => `${u.searchParams.get('offset')}/${u.searchParams.get('limit')}`)

test.describe('Explore pages through the API', () => {
  test('loads one page, then more on request, until everything is shown', async ({ page, api }) => {
    api.offers = manyOffers(60)
    await page.goto('/explore')

    await expect(page.getByRole('article')).toHaveCount(24)
    await expect(page.getByText('Showing 24 of 60 offers')).toBeVisible()

    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByRole('article')).toHaveCount(48)
    await expect(page.getByText('Showing 48 of 60 offers')).toBeVisible()

    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByRole('article')).toHaveCount(60)
    await expect(page.getByRole('button', { name: 'Load more offers' })).toHaveCount(0)

    expect(offsets(api)).toEqual(['0/24', '24/24', '48/24'])
  })

  test('never downloads the whole catalogue just to show the first page', async ({ page, api }) => {
    api.offers = manyOffers(60)
    await page.goto('/explore')
    await expect(page.getByRole('article')).toHaveCount(24)

    expect(offersRequests(api).every((u) => u.searchParams.get('limit') === '24')).toBe(true)
  })

  test('a failed page keeps what is on screen, says so, and can be retried', async ({ page, api }) => {
    api.offers = manyOffers(60)
    api.failOffset = 24
    await page.goto('/explore')
    await expect(page.getByRole('article')).toHaveCount(24)

    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Couldn’t load more offers' })).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(24)

    api.failOffset = null
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('article')).toHaveCount(48)
  })

  test('rows repeated across pages (unstable server ordering) are shown once', async ({ page, api }) => {
    api.offers = manyOffers(60)
    api.overlap = 2
    await page.goto('/explore')
    await expect(page.getByRole('article')).toHaveCount(24)

    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByText(/Showing 4\d of 60 offers/)).toBeVisible()
    await page.getByRole('button', { name: 'Load more offers' }).click({ timeout: 5000 }).catch(() => undefined)

    const titles = await page.getByRole('article').locator('h3').allTextContents()
    expect(new Set(titles).size).toBe(titles.length)
  })

  test('changing a filter starts again from the first page', async ({ page, api }) => {
    api.offers = manyOffers(60)
    await page.goto('/explore')
    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByRole('article')).toHaveCount(48)

    await page.goto('/explore?bank=hnb')
    await expect(page.getByRole('article')).toHaveCount(24)
    const last = offersRequests(api).at(-1)!
    expect(last.searchParams.get('offset')).toBe('0')
    expect(last.searchParams.get('bank')).toBe('hnb')
  })

  test('category options come from the merchants directory, without the literal "All"', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('complementary').getByRole('combobox', { name: 'Category' }).click()

    for (const name of ['Dining', 'Supermarket', 'Leisure']) {
      await expect(page.getByRole('option', { name })).toBeVisible()
    }
    await expect(page.getByRole('option', { name: 'All', exact: true })).toHaveCount(0)
  })

  test('sorting by discount loads the full set, since the API cannot sort on it', async ({ page, api }) => {
    api.offers = manyOffers(60)
    await page.goto('/explore?sortBy=discount')

    await expect(page.getByRole('article')).toHaveCount(24)
    expect(offersRequests(api).some((u) => u.searchParams.get('limit') === '500')).toBe(true)
    await page.getByRole('button', { name: 'Load more offers' }).click()
    await expect(page.getByRole('article')).toHaveCount(48)
  })

  test('an expired offer that leaks from the API is still hidden', async ({ page, api }) => {
    api.leakExpired = true
    await page.goto('/explore')

    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Old Deal Cafe' })).toHaveCount(0)
  })
})

test.describe('Other pages stay light', () => {
  test('Home fetches one small page of offers, not the catalogue', async ({ page, api }) => {
    api.offers = manyOffers(60)
    await page.goto('/')
    await expect(page.getByRole('article')).toHaveCount(8)

    expect(offersRequests(api).map((u) => u.searchParams.get('limit'))).toEqual(['12'])
    await expect(page.getByRole('article')).toHaveCount(8)
  })

  test('Saved fetches only the saved offers, by id', async ({ page, api }) => {
    await page.goto('/explore')
    await page.getByRole('button', { name: 'Save offer' }).first().click()
    await page.getByRole('button', { name: 'Save offer' }).first().click()
    api.requests.length = 0

    await page.goto('/saved')
    await expect(page.getByRole('article')).toHaveCount(2)

    expect(offersRequests(api)).toHaveLength(0) // no list/catalogue request
    expect(api.requests.filter((u) => /^\/api\/offers\/[^/]+$/.test(u.pathname)).length).toBe(2)
  })

  test('a saved offer that no longer exists is dropped quietly', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lanka_offers_saved', JSON.stringify(['o-plain', 'gone-forever'])))
    await page.goto('/saved')

    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })
})
