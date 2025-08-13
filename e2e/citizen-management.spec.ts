import { test, expect } from '@playwright/test'

test.describe('Citizen Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display citizens list', async ({ page }) => {
    await page.goto('/citizens')
    
    // Should show page title
    await expect(page.locator('h1')).toContainText('Data Penduduk')
    
    // Should show citizens table
    await expect(page.locator('[data-testid="citizens-table"]')).toBeVisible()
    
    // Should show test citizen
    await expect(page.locator('table')).toContainText(process.env.TEST_CITIZEN_NAME!)
    await expect(page.locator('table')).toContainText(process.env.TEST_CITIZEN_NIK!)
  })

  test('should search citizens', async ({ page }) => {
    await page.goto('/citizens')
    
    // Search by name
    await page.fill('input[placeholder*="Cari"]', 'John')
    await page.press('input[placeholder*="Cari"]', 'Enter')
    
    // Should show filtered results
    await expect(page.locator('table')).toContainText('John Doe Test')
    
    // Clear search
    await page.fill('input[placeholder*="Cari"]', '')
    await page.press('input[placeholder*="Cari"]', 'Enter')
  })

  test('should create new citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click add citizen button
    await page.click('[data-testid="add-citizen-button"]')
    
    // Should navigate to create form
    await expect(page).toHaveURL(/.*\/citizens\/create/)
    await expect(page.locator('h1')).toContainText('Tambah Penduduk')
    
    // Fill form
    await page.fill('input[name="nik"]', '9876543210987654')
    await page.fill('input[name="name"]', 'Jane Doe Test')
    await page.fill('input[name="birthDate"]', '1995-05-15')
    await page.fill('input[name="birthPlace"]', 'Bandung')
    await page.selectOption('select[name="gender"]', 'P')
    await page.selectOption('select[name="religion"]', 'KRISTEN')
    await page.selectOption('select[name="education"]', 'S1')
    await page.fill('input[name="occupation"]', 'Teacher')
    await page.selectOption('select[name="maritalStatus"]', 'BELUM_KAWIN')
    await page.fill('input[name="rt"]', '003')
    await page.fill('input[name="rw"]', '004')
    await page.fill('textarea[name="address"]', 'Jl. Sudirman No. 5')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Penduduk berhasil ditambahkan')
    
    // Should redirect to citizens list
    await expect(page).toHaveURL(/.*\/citizens/)
    
    // Should show new citizen in list
    await expect(page.locator('table')).toContainText('Jane Doe Test')
  })

  test('should validate citizen form', async ({ page }) => {
    await page.goto('/citizens/create')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-nik"]')).toContainText('NIK harus diisi')
    await expect(page.locator('[data-testid="error-name"]')).toContainText('Nama harus diisi')
    
    // Fill invalid NIK
    await page.fill('input[name="nik"]', '123')
    await page.blur('input[name="nik"]')
    
    // Should show NIK validation error
    await expect(page.locator('[data-testid="error-nik"]')).toContainText('NIK harus 16 digit')
  })

  test('should edit citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click edit button for test citizen
    await page.click(`[data-testid="edit-citizen-${process.env.TEST_CITIZEN_NIK}"]`)
    
    // Should navigate to edit form
    await expect(page).toHaveURL(/.*\/citizens\/.*\/edit/)
    
    // Form should be pre-filled
    await expect(page.locator('input[name="name"]')).toHaveValue(process.env.TEST_CITIZEN_NAME!)
    
    // Update name
    await page.fill('input[name="name"]', 'John Doe Updated')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Penduduk berhasil diperbarui')
    
    // Should show updated name in list
    await expect(page.locator('table')).toContainText('John Doe Updated')
  })

  test('should delete citizen', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click delete button
    await page.click(`[data-testid="delete-citizen-${process.env.TEST_CITIZEN_NIK}"]`)
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toContainText('Apakah Anda yakin')
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Penduduk berhasil dihapus')
    
    // Citizen should be removed from list
    await expect(page.locator('table')).not.toContainText(process.env.TEST_CITIZEN_NAME!)
  })

  test('should export citizens data', async ({ page }) => {
    await page.goto('/citizens')
    
    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-citizens"]')
    
    // Should download file
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/citizens.*\.xlsx/)
  })

  test('should handle pagination', async ({ page }) => {
    await page.goto('/citizens')
    
    // Should show pagination if there are many records
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page"]')
      
      // URL should update with page parameter
      await expect(page).toHaveURL(/.*page=2/)
      
      // Click previous page
      await page.click('[data-testid="prev-page"]')
      await expect(page).toHaveURL(/.*page=1/)
    }
  })

  test('should filter by RT/RW', async ({ page }) => {
    await page.goto('/citizens')
    
    // Select RT filter
    await page.selectOption('select[name="rt"]', '001')
    
    // Should filter results
    await expect(page.locator('table tbody tr')).toHaveCount(1)
    
    // Clear filter
    await page.selectOption('select[name="rt"]', '')
  })
})