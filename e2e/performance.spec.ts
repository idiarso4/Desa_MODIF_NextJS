import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for performance tests
    await page.goto('/login')
    await page.fill('[name="username"]', 'admin')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check that key elements are visible
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
  })

  test('Citizens list loads and paginates efficiently', async ({ page }) => {
    await page.goto('/citizens')
    
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const initialLoadTime = Date.now() - startTime
    
    // Initial load should be under 2 seconds
    expect(initialLoadTime).toBeLessThan(2000)
    
    // Test pagination performance
    const paginationStartTime = Date.now()
    await page.click('[data-testid="pagination-next"]')
    await page.waitForLoadState('networkidle')
    const paginationTime = Date.now() - paginationStartTime
    
    // Pagination should be under 1 second
    expect(paginationTime).toBeLessThan(1000)
  })

  test('Search functionality is responsive', async ({ page }) => {
    await page.goto('/citizens')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('[data-testid="search-input"]')
    
    // Test search response time
    const startTime = Date.now()
    await searchInput.fill('John')
    await page.waitForTimeout(500) // Debounce time
    await page.waitForLoadState('networkidle')
    const searchTime = Date.now() - startTime
    
    // Search should complete within 1.5 seconds
    expect(searchTime).toBeLessThan(1500)
  })

  test('Form submission is efficient', async ({ page }) => {
    await page.goto('/citizens/create')
    
    // Fill form with test data
    await page.fill('[name="nik"]', '1234567890123456')
    await page.fill('[name="name"]', 'Test Performance User')
    await page.fill('[name="birthDate"]', '1990-01-01')
    await page.fill('[name="birthPlace"]', 'Jakarta')
    await page.selectOption('[name="gender"]', 'L')
    await page.selectOption('[name="religion"]', 'ISLAM')
    await page.selectOption('[name="education"]', 'S1')
    await page.selectOption('[name="maritalStatus"]', 'BELUM_KAWIN')
    
    const startTime = Date.now()
    await page.click('button[type="submit"]')
    await page.waitForURL('/citizens')
    const submitTime = Date.now() - startTime
    
    // Form submission should complete within 3 seconds
    expect(submitTime).toBeLessThan(3000)
  })

  test('Large data export performance', async ({ page }) => {
    await page.goto('/citizens')
    
    const startTime = Date.now()
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-button"]')
    const download = await downloadPromise
    
    const exportTime = Date.now() - startTime
    
    // Export should start within 5 seconds
    expect(exportTime).toBeLessThan(5000)
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('citizens')
  })

  test('Map rendering performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/maps')
    await page.waitForSelector('[data-testid="map-container"]')
    
    // Wait for map to fully load
    await page.waitForFunction(() => {
      const mapContainer = document.querySelector('[data-testid="map-container"]')
      return mapContainer && mapContainer.querySelector('.leaflet-map-pane')
    })
    
    const mapLoadTime = Date.now() - startTime
    
    // Map should load within 4 seconds
    expect(mapLoadTime).toBeLessThan(4000)
  })

  test('API response times are acceptable', async ({ page }) => {
    // Monitor network requests
    const apiRequests: Array<{ url: string; duration: number }> = []
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request()
        const timing = response.timing()
        apiRequests.push({
          url: response.url(),
          duration: timing.responseEnd
        })
      }
    })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check that API requests are reasonably fast
    for (const request of apiRequests) {
      expect(request.duration).toBeLessThan(2000) // 2 seconds max
    }
  })

  test('Memory usage remains stable during navigation', async ({ page }) => {
    // Navigate through multiple pages to test for memory leaks
    const pages = ['/dashboard', '/citizens', '/letters', '/finance', '/users']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Check for JavaScript errors that might indicate memory issues
      const errors = await page.evaluate(() => {
        return (window as any).jsErrors || []
      })
      
      expect(errors.length).toBe(0)
    }
  })

  test('Concurrent user simulation', async ({ browser }) => {
    // Simulate multiple users accessing the system
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])
    
    const pages = await Promise.all(contexts.map(context => context.newPage()))
    
    // All users login simultaneously
    const loginPromises = pages.map(async (page, index) => {
      await page.goto('/login')
      await page.fill('[name="username"]', `user${index + 1}`)
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      return page.waitForURL('/dashboard')
    })
    
    const startTime = Date.now()
    await Promise.all(loginPromises)
    const concurrentLoginTime = Date.now() - startTime
    
    // Concurrent logins should complete within 5 seconds
    expect(concurrentLoginTime).toBeLessThan(5000)
    
    // Clean up
    await Promise.all(contexts.map(context => context.close()))
  })
})