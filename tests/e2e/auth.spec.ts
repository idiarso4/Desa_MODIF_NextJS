/**
 * Authentication E2E Tests
 * Tests for login, logout, and authentication flows
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('h1')).toContainText('OpenSID')
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation messages
    await expect(page.locator('text=Username is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[name="username"]', 'invalid_user')
    await page.fill('input[name="password"]', 'invalid_password')
    await page.click('button[type="submit"]')

    // Check for error message
    await expect(page.locator('text=Username atau password salah')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill form with valid credentials
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should handle password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const toggleButton = page.locator('button[type="button"]').last()

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should implement rate limiting', async ({ page }) => {
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="username"]', 'invalid_user')
      await page.fill('input[name="password"]', 'invalid_password')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
    }

    // Should show lockout message
    await expect(page.locator('text=Akun terkunci')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should redirect unauthenticated users', async ({ page }) => {
    // Try to access protected page without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Refresh page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check if login form is properly displayed on mobile
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check if elements are properly sized
    const loginCard = page.locator('[data-testid="login-card"]')
    await expect(loginCard).toBeVisible()
  })
})
