import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login')
    await page.fill('[data-testid="username"]', 'admin')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('should display dashboard statistics', async ({ page }) => {
    // Check if statistics cards are visible
    await expect(page.locator('[data-testid="total-citizens"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-families"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-letters"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-complaints"]')).toBeVisible()

    // Check if statistics have numeric values
    const totalCitizens = await page.locator('[data-testid="total-citizens"] .stat-value').textContent()
    expect(totalCitizens).toMatch(/^\d+$/)
  })

  test('should display recent activities', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
    
    // Check if activities list exists
    const activities = page.locator('[data-testid="activity-item"]')
    await expect(activities.first()).toBeVisible()
  })

  test('should navigate to different modules from quick actions', async ({ page }) => {
    // Test navigation to citizens module
    await page.click('[data-testid="quick-action-citizens"]')
    await page.waitForURL('/citizens')
    await expect(page.locator('h1')).toContainText('Data Penduduk')

    // Go back to dashboard
    await page.goto('/dashboard')

    // Test navigation to letters module
    await page.click('[data-testid="quick-action-letters"]')
    await page.waitForURL('/letters')
    await expect(page.locator('h1')).toContainText('Layanan Surat')
  })

  test('should display charts and visualizations', async ({ page }) => {
    // Check if demographic chart is visible
    await expect(page.locator('[data-testid="demographic-chart"]')).toBeVisible()
    
    // Check if age distribution chart is visible
    await expect(page.locator('[data-testid="age-distribution-chart"]')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if mobile navigation works
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()
    
    // Check if statistics cards stack vertically
    const statsContainer = page.locator('[data-testid="stats-container"]')
    await expect(statsContainer).toHaveCSS('flex-direction', 'column')
  })

  test('should handle loading states', async ({ page }) => {
    // Intercept API calls to simulate slow loading
    await page.route('/api/dashboard/statistics', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.reload()
    
    // Check if loading skeleton is shown
    await expect(page.locator('[data-testid="stats-loading"]')).toBeVisible()
    
    // Wait for data to load
    await expect(page.locator('[data-testid="total-citizens"]')).toBeVisible({ timeout: 5000 })
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('/api/dashboard/statistics', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.reload()
    
    // Check if error message is shown
    await expect(page.locator('[data-testid="stats-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="stats-error"]')).toContainText('Gagal memuat data')
  })
})