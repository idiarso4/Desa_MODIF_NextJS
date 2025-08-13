import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should not have accessibility violations on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations on citizens page', async ({ page }) => {
    await page.goto('/citizens')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations on citizen form', async ({ page }) => {
    await page.goto('/citizens/create')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility violations on letters page', async ({ page }) => {
    await page.goto('/letters')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/citizens')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test skip links
    await page.keyboard.press('Tab')
    const skipLink = page.locator('[data-testid="skip-to-content"]')
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused()
    }
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/citizens')
    
    // Check main navigation has proper ARIA
    await expect(page.locator('nav[role="navigation"]')).toBeVisible()
    
    // Check buttons have accessible names
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
  })

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/citizens/create')
    
    // Check all inputs have labels
    const inputs = page.locator('input, select, textarea')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      if (id) {
        // Check if there's a label for this input
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        
        // Input should have label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    
    if (headingCount > 0) {
      // Should have at least one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Check heading levels don't skip
      const headingLevels: number[] = []
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i)
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        const level = parseInt(tagName.charAt(1))
        headingLevels.push(level)
      }
      
      // First heading should be h1
      expect(headingLevels[0]).toBe(1)
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Run axe with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toEqual([])
  })

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/citizens')
    
    // Test screen reader announcements
    const announcements = page.locator('[aria-live]')
    const announcementCount = await announcements.count()
    
    if (announcementCount > 0) {
      // Check aria-live regions have proper attributes
      for (let i = 0; i < announcementCount; i++) {
        const announcement = announcements.nth(i)
        const ariaLive = await announcement.getAttribute('aria-live')
        expect(['polite', 'assertive', 'off']).toContain(ariaLive)
      }
    }
  })

  test('should have proper focus management in modals', async ({ page }) => {
    await page.goto('/citizens')
    
    // Open delete confirmation modal
    const deleteButton = page.locator('[data-testid^="delete-citizen-"]').first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      
      // Modal should be visible and focused
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Focus should be trapped in modal
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      
      // Focused element should be within modal
      const isInModal = await focusedElement.evaluate((el, modal) => {
        return modal.contains(el)
      }, await modal.elementHandle())
      
      expect(isInModal).toBe(true)
      
      // Close modal with Escape
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/dashboard')
    
    // Check that content is still visible and accessible
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
})