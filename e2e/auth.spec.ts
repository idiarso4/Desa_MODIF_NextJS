import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('h1')).toContainText('Masuk ke OpenSID')
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Should show user info in header
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('Test Admin')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill with invalid credentials
    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'invalid')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Username atau password salah')
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Click user menu
    await page.click('[data-testid="user-menu"]')
    
    // Click logout
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
  })

  test('should change password successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_STAFF_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_STAFF_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Go to profile page
    await page.goto('/profile/change-password')
    
    // Fill change password form
    await page.fill('input[name="currentPassword"]', process.env.TEST_STAFF_PASSWORD!)
    await page.fill('input[name="newPassword"]', 'newpassword123')
    await page.fill('input[name="confirmPassword"]', 'newpassword123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password berhasil diubah')
    
    // Logout and login with new password
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    await page.fill('input[name="username"]', process.env.TEST_STAFF_USERNAME!)
    await page.fill('input[name="password"]', 'newpassword123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should handle session timeout', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    
    // Simulate session expiry by clearing cookies
    await page.context().clearCookies()
    
    // Try to access protected page
    await page.goto('/citizens')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
  })
})