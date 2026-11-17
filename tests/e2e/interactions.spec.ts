import { test, expect } from './support'

test.describe('Search feedback', () => {
  test('explore search updates as you type and can be cleared', async ({ page }) => {
    await page.goto('/explore')
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()

    const box = page.getByRole('main').getByRole('searchbox')
    await box.fill('oak')
    await expect(page).toHaveURL(/search=oak/)
    await expect(page.getByRole('heading', { name: 'Oak Ray Colombo City Hotel' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toHaveCount(0)

    await page.getByRole('main').getByRole('button', { name: 'Clear search' }).click()
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })

  test('a filter chip can be removed from the keyboard', async ({ page }) => {
    await page.goto('/explore?bank=boc')
    const chip = page.getByRole('list', { name: 'Applied filters' }).getByRole('button', { name: /Bank of Ceylon/ })
    await chip.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('heading', { name: 'Pizza Hut' })).toBeVisible()
  })
})

test.describe('Saving', () => {
  test('the save control shows that it is pressed', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('button', { name: 'Save offer' }).first().click()
    await expect(page.getByRole('button', { name: 'Remove from saved' }).first()).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Nearby map', () => {
  test('map view can focus a confirmed branch and leaves area-only offers unpinned', async ({ page }) => {
    await page.goto('/nearby')
    await page.getByRole('button', { name: /View map/ }).click()

    const map = page.getByRole('region', { name: 'Map of confirmed branch locations' })
    await expect(map).toBeVisible()

    const branch = page.getByRole('article').filter({ hasText: 'Keells Fort' })
    await branch.getByRole('button', { name: 'Show on map' }).click()
    await expect(branch).toHaveAttribute('data-selected', 'true')

    await expect(
      page.getByRole('article').filter({ hasText: 'Thai Rasa' }).getByRole('button', { name: 'Show on map' })
    ).toHaveCount(0)
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2)
  })
})

test.describe('Mobile filter sheet @mobile', () => {
  test('explains that filters apply immediately and can be closed', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('button', { name: 'Filters' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Filters apply as soon as you choose them.')
    await dialog.getByRole('button', { name: 'Show results' }).click()
    await expect(dialog).toBeHidden()
  })
})
