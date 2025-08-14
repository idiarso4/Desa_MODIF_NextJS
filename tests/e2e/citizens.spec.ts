/**
 * Citizens Management E2E Tests
 * Tests for citizen CRUD operations and workflows
 */

import { test, expect } from '@playwright/test'

test.describe('Citizens Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should navigate to citizens page', async ({ page }) => {
    // Navigate to citizens page
    await page.click('text=Kependudukan')
    await page.click('text=Data Penduduk')
    
    await expect(page).toHaveURL('/citizens')
    await expect(page.locator('h1')).toContainText('Data Penduduk')
  })

  test('should display citizens table', async ({ page }) => {
    await page.goto('/citizens')
    
    // Check if table is displayed
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th')).toContainText('NIK')
    await expect(page.locator('th')).toContainText('Nama')
    await expect(page.locator('th')).toContainText('Jenis Kelamin')
  })

  test('should search citizens', async ({ page }) => {
    await page.goto('/citizens')
    
    // Wait for table to load
    await page.waitForSelector('table')
    
    // Search for a citizen
    await page.fill('input[placeholder*="Cari"]', 'Ahmad')
    await page.waitForTimeout(500) // Wait for debounced search
    
    // Check if search results are filtered
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toContainText('Ahmad')
  })

  test('should create new citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click add citizen button
    await page.click('text=Tambah Penduduk')
    
    // Fill citizen form
    await page.fill('input[name="nik"]', '3201234567890999')
    await page.fill('input[name="name"]', 'Test Citizen E2E')
    await page.fill('input[name="birthPlace"]', 'Jakarta')
    await page.fill('input[name="birthDate"]', '1990-01-01')
    await page.selectOption('select[name="gender"]', 'L')
    await page.selectOption('select[name="religion"]', 'ISLAM')
    await page.selectOption('select[name="education"]', 'SMA')
    await page.fill('input[name="occupation"]', 'Programmer')
    await page.selectOption('select[name="maritalStatus"]', 'BELUM_KAWIN')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to citizens list
    await expect(page).toHaveURL('/citizens')
    
    // Should show success message
    await expect(page.locator('text=berhasil ditambahkan')).toBeVisible()
    
    // Should find the new citizen in the table
    await page.fill('input[placeholder*="Cari"]', 'Test Citizen E2E')
    await expect(page.locator('text=Test Citizen E2E')).toBeVisible()
  })

  test('should edit citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Find and click edit button for first citizen
    await page.click('tbody tr:first-child button[title="Edit"]')
    
    // Update citizen name
    await page.fill('input[name="name"]', 'Updated Citizen Name')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect back to citizens list
    await expect(page).toHaveURL('/citizens')
    
    // Should show success message
    await expect(page.locator('text=berhasil diperbarui')).toBeVisible()
  })

  test('should view citizen details', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click view button for first citizen
    await page.click('tbody tr:first-child button[title="View"]')
    
    // Should navigate to detail page
    await expect(page.url()).toContain('/citizens/')
    await expect(page.locator('h1')).toContainText('Detail Penduduk')
    
    // Should display citizen information
    await expect(page.locator('text=NIK')).toBeVisible()
    await expect(page.locator('text=Nama Lengkap')).toBeVisible()
    await expect(page.locator('text=Tanggal Lahir')).toBeVisible()
  })

  test('should delete citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Find citizen to delete
    await page.fill('input[placeholder*="Cari"]', 'Test Citizen E2E')
    await page.waitForTimeout(500)
    
    // Click delete button
    await page.click('tbody tr:first-child button[title="Delete"]')
    
    // Confirm deletion
    await page.click('text=Hapus')
    
    // Should show success message
    await expect(page.locator('text=berhasil dihapus')).toBeVisible()
    
    // Citizen should no longer be in the table
    await expect(page.locator('text=Test Citizen E2E')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/citizens')
    await page.click('text=Tambah Penduduk')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=NIK wajib diisi')).toBeVisible()
    await expect(page.locator('text=Nama wajib diisi')).toBeVisible()
  })

  test('should validate NIK format', async ({ page }) => {
    await page.goto('/citizens')
    await page.click('text=Tambah Penduduk')
    
    // Fill invalid NIK
    await page.fill('input[name="nik"]', '123')
    await page.fill('input[name="name"]', 'Test Name')
    await page.click('button[type="submit"]')
    
    // Should show NIK validation error
    await expect(page.locator('text=NIK harus 16 digit')).toBeVisible()
  })

  test('should prevent duplicate NIK', async ({ page }) => {
    await page.goto('/citizens')
    await page.click('text=Tambah Penduduk')
    
    // Try to create citizen with existing NIK
    await page.fill('input[name="nik"]', '3201234567890001') // Assuming this exists
    await page.fill('input[name="name"]', 'Duplicate NIK Test')
    await page.fill('input[name="birthPlace"]', 'Jakarta')
    await page.fill('input[name="birthDate"]', '1990-01-01')
    await page.selectOption('select[name="gender"]', 'L')
    
    await page.click('button[type="submit"]')
    
    // Should show duplicate NIK error
    await expect(page.locator('text=NIK sudah terdaftar')).toBeVisible()
  })

  test('should filter citizens by gender', async ({ page }) => {
    await page.goto('/citizens')
    
    // Open filter
    await page.click('text=Filter')
    
    // Select male gender filter
    await page.selectOption('select[name="gender"]', 'L')
    
    // Apply filter
    await page.click('button:has-text("Terapkan")')
    
    // All visible citizens should be male
    const genderBadges = page.locator('tbody tr td:has-text("Laki-laki")')
    await expect(genderBadges.first()).toBeVisible()
  })

  test('should export citizens data', async ({ page }) => {
    await page.goto('/citizens')
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export')
    const download = await downloadPromise
    
    // Check download
    expect(download.suggestedFilename()).toContain('citizens')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should paginate citizens list', async ({ page }) => {
    await page.goto('/citizens')
    
    // Check pagination controls
    await expect(page.locator('text=Halaman')).toBeVisible()
    
    // Go to next page if available
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isEnabled()) {
      await nextButton.click()
      await expect(page.locator('text=Halaman 2')).toBeVisible()
    }
  })

  test('should sort citizens by name', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click on name column header to sort
    await page.click('th:has-text("Nama")')
    
    // Wait for sorting to complete
    await page.waitForTimeout(500)
    
    // Get first two citizen names
    const firstCitizen = await page.locator('tbody tr:first-child td:nth-child(2)').textContent()
    const secondCitizen = await page.locator('tbody tr:nth-child(2) td:nth-child(2)').textContent()
    
    // Should be in alphabetical order
    expect(firstCitizen?.localeCompare(secondCitizen || '') || 0).toBeLessThanOrEqual(0)
  })

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/citizens')
    
    // Select multiple citizens
    await page.check('tbody tr:first-child input[type="checkbox"]')
    await page.check('tbody tr:nth-child(2) input[type="checkbox"]')
    
    // Should show bulk action buttons
    await expect(page.locator('text=2 dipilih')).toBeVisible()
    await expect(page.locator('button:has-text("Export Terpilih")')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/citizens')
    
    // Check if table is responsive
    await expect(page.locator('table')).toBeVisible()
    
    // Check if mobile navigation works
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  })
})
