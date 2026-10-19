import { test, expect } from './support'

test.describe('Home', () => {
  test('explains the product and shows the supported banks with honest counts', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find bank offers in one place')
    const banks = page.getByRole('region', { name: 'Banks' })
    await expect(banks.getByRole('link', { name: /Hatton National Bank/ })).toContainText('3 active offers')
    await expect(banks.getByRole('link', { name: /Bank of Ceylon/ })).toContainText('1 active offers')

    // A bank with no active offers is shown honestly and is not a link.
    await expect(banks.getByText('National Savings Bank')).toBeVisible()
    await expect(banks.getByRole('link', { name: /National Savings Bank/ })).toHaveCount(0)
    await expect(banks.getByText('No active offers yet').first()).toBeVisible()
  })

  test('highest discounts exclude expired offers', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Pizza Hut', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Old Deal Cafe')).toHaveCount(0)
  })

  test('has a skip link and a main landmark', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('main')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  })
})

test.describe('Navigation', () => {
  test('header links move between sections and mark the current page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Explore' }).click()
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Explore' })).toHaveAttribute(
      'aria-current',
      'page'
    )

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Nearby' }).click()
    await expect(page).toHaveURL(/\/nearby$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nearby offers')
  })
})

test.describe('Search', () => {
  test('header search goes to Explore and queries the API with the term', async ({ page, api }) => {
    await page.goto('/')

    await page.getByRole('search').first().getByRole('searchbox').fill('oak ray')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/explore\?search=oak%20ray/)
    await expect(page.getByRole('heading', { name: 'Oak Ray Colombo City Hotel' })).toBeVisible()
    await expect(page.getByText('Pizza Hut', { exact: true })).toHaveCount(0)
    expect(api.requests.some((u) => u.pathname === '/api/offers' && u.searchParams.get('search') === 'oak ray')).toBe(true)
  })

  test('no results shows an empty state with a way back', async ({ page }) => {
    await page.goto('/explore?search=zzzzzz')

    await expect(page.getByText('No offers found')).toBeVisible()
    const clear = page.getByRole('main').getByRole('button', { name: 'Clear filters' }).last()
    await expect(clear).toBeVisible()
    await clear.click()
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })
})

test.describe('Explore filters', () => {
  test('choosing a bank from Home filters the list and shows a removable chip', async ({ page, api }) => {
    await page.goto('/')
    await page.getByRole('region', { name: 'Banks' }).getByRole('link', { name: /Bank of Ceylon/ }).click()

    await expect(page).toHaveURL(/\/explore\?bank=boc/)
    await expect(page.getByRole('heading', { name: 'Oak Ray Colombo City Hotel' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toHaveCount(0)
    expect(api.requests.some((u) => u.pathname === '/api/offers' && u.searchParams.get('bank') === 'boc')).toBe(true)

    const chips = page.getByRole('list', { name: 'Applied filters' })
    await expect(chips.getByRole('button', { name: /Bank of Ceylon/ })).toBeVisible()
    await chips.getByRole('button', { name: /Bank of Ceylon/ }).click()
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })

  test('expired offers returned by the API are not listed', async ({ page }) => {
    await page.goto('/explore')

    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Old Deal Cafe' })).toHaveCount(0)
    await expect(page.getByText('5 offers found')).toBeVisible()
  })

  test('sorting by discount puts the highest first and offers without one last', async ({ page }) => {
    await page.goto('/explore?sortBy=discount')
    await expect(page.getByRole('article')).toHaveCount(5)

    const titles = await page.getByRole('article').locator('h3').allTextContents()
    expect(titles[0]).toBe('Oak Ray Colombo City Hotel') // 35%
    expect(titles[titles.length - 1]).toBe('VISA Offers') // no discount
  })
})

test.describe('Offer cards state discounts exactly as the bank does', () => {
  test('plain, "up to" and absent discounts', async ({ page }) => {
    await page.goto('/explore')

    const pizza = page.getByRole('article').filter({ hasText: 'Pizza Hut' })
    await expect(pizza).toContainText('30% off')
    await expect(pizza).not.toContainText('Up to')

    const oak = page.getByRole('article').filter({ hasText: 'Oak Ray' })
    await expect(oak).toContainText('Up to 35% off')

    const visa = page.getByRole('article').filter({ hasText: 'VISA Offers' }).first()
    await expect(visa).not.toContainText('% off')
  })

  test('online and island-wide offers are named as such', async ({ page }) => {
    await page.goto('/explore')

    await expect(page.getByRole('article').filter({ hasText: 'Daraz' })).toContainText('Online')
    await expect(page.getByRole('article').filter({ hasText: 'Keells' })).toContainText('Islandwide')
  })
})
