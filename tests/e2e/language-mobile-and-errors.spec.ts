import { test, expect } from './support'

test.describe('Language switching', () => {
  test('switches to Sinhala and Tamil and remembers the choice', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /English/ }).click()
    await page.getByRole('menuitem', { name: 'සිංහල' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('එක තැනකින් බැංකු දීමනා සොයන්න')
    await expect(page.locator('html')).toHaveAttribute('lang', 'si')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('එක තැනකින් බැංකු දීමනා සොයන්න')

    await page.getByRole('button', { name: /සිංහල/ }).click()
    await page.getByRole('menuitem', { name: 'தமிழ்' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ta')
  })

  test('discount wording follows each language\'s grammar, and a plain discount never says "up to"', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('lanka_offers_lang')) localStorage.setItem('lanka_offers_lang', 'si')
    })
    await page.goto('/explore')
    await expect(page.getByRole('article').filter({ hasText: 'Oak Ray' })).toContainText('උපරිම 35% වට්ටමක්')
    await expect(page.getByRole('article').filter({ hasText: 'Pizza Hut' })).toContainText('30% වට්ටමක්')
    await expect(page.getByRole('article').filter({ hasText: 'Pizza Hut' })).not.toContainText('උපරිම')

    await page.evaluate(() => localStorage.setItem('lanka_offers_lang', 'ta'))
    await page.reload()
    await expect(page.getByRole('article').filter({ hasText: 'Oak Ray' })).toContainText('35% வரை தள்ளுபடி')
  })

  test('long Sinhala and Tamil text does not overflow a phone screen @mobile', async ({ page }) => {
    for (const lang of ['si', 'ta']) {
      await page.addInitScript((l) => localStorage.setItem('lanka_offers_lang', l), lang)
      for (const path of ['/', '/explore', '/nearby', '/offers/o-upto']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${lang} ${path}`).toBeLessThanOrEqual(1)
      }
    }
  })
})

test.describe('Mobile layout @mobile', () => {
  test('bottom navigation reaches each section without horizontal scroll', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.fixed')

    await expect(nav).toBeVisible()
    await nav.getByRole('link', { name: 'Nearby' }).click()
    await expect(page).toHaveURL(/\/nearby$/)
    await nav.getByRole('link', { name: 'Explore' }).click()
    await expect(page).toHaveURL(/\/explore$/)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('the filter sheet opens and applies a filter', async ({ page, api }) => {
    await page.goto('/explore')

    await page.getByRole('button', { name: 'Filters' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Bank of Ceylon' }).click()

    await expect(page).toHaveURL(/bank=boc/)
    expect(api.requests.some((u) => u.searchParams.get('bank') === 'boc')).toBe(true)
  })

  test('header menu opens and shows the search field', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    await expect(page.getByRole('search')).toHaveCount(2)
  })
})

test.describe('Errors and resilience', () => {
  test('a failing API shows an error state with retry, and retry recovers', async ({ page, api }) => {
    api.offersStatus = 500
    await page.goto('/explore')

    await expect(page.getByText('Something went wrong')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()

    api.offersStatus = null
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })

  test('the offers page makes no request outside the fixtures', async ({ page, api }) => {
    await page.goto('/explore')
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()

    expect(api.requests.every((u) => u.pathname.startsWith('/api/'))).toBe(true)
    expect(api.external).toEqual([])
  })

  test('saving an offer is remembered on this device only', async ({ page, api }) => {
    await page.goto('/explore')

    await page.getByRole('button', { name: 'Save offer' }).first().click()
    await page.goto('/saved')

    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
    // Saving made no API write.
    expect(api.requests.some((u) => u.pathname.includes('save'))).toBe(false)
  })
})
