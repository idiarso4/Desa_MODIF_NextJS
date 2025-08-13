import { expect, Page, test } from '@playwright/test'

test.describe('Public Interface', () => {
  test.describe('Public Homepage', () => {
    test('should display village information', async ({ page }: { page: Page }) => {
      await page.goto('/public')
      
      // Check if main sections are visible
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="village-info"]')).toBeVisible()
      await expect(page.locator('[data-testid="statistics-section"]')).toBeVisible()
      await expect(page.locator('[data-testid="news-section"]')).toBeVisible()
      
      // Check if village name is displayed
      await expect(page.locator('[data-testid="village-name"]')).toContainText('Desa')
    })

    test('should display latest news and announcements', async ({ page }: { page: Page }) => {
      await page.goto('/public')
      
      // Check if news articles are displayed
      const newsItems = page.locator('[data-testid="news-item"]')
      await expect(newsItems).toHaveCount(3)
      
      // Check if announcements are displayed
      const announcements = page.locator('[data-testid="announcement"]')
      await expect(announcements).toBeVisible()
    })
  })
})