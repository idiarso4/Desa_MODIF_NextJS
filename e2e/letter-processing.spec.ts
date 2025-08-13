import { test, expect } from '@playwright/test'

test.describe('Letter Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_USERNAME!)
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display letter requests list', async ({ page }) => {
    await page.goto('/letters')
    
    // Should show page title
    await expect(page.locator('h1')).toContainText('Permohonan Surat')
    
    // Should show requests table
    await expect(page.locator('[data-testid="letters-table"]')).toBeVisible()
    
    // Should show test letter request
    await expect(page.locator('table')).toContainText('DOMICILE')
    await expect(page.locator('table')).toContainText('PENDING')
  })

  test('should create new letter request', async ({ page }) => {
    await page.goto('/letters')
    
    // Click add request button
    await page.click('[data-testid="add-letter-button"]')
    
    // Should navigate to create form
    await expect(page).toHaveURL(/.*\/letters\/create/)
    
    // Fill form
    await page.fill('input[name="citizenSearch"]', process.env.TEST_CITIZEN_NAME!)
    await page.click(`[data-testid="select-citizen-${process.env.TEST_CITIZEN_NIK}"]`)
    
    await page.selectOption('select[name="letterType"]', 'BUSINESS')
    await page.fill('textarea[name="purpose"]', 'Untuk keperluan membuka usaha')
    await page.fill('textarea[name="notes"]', 'Catatan tambahan untuk surat usaha')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Permohonan surat berhasil dibuat')
    
    // Should redirect to letters list
    await expect(page).toHaveURL(/.*\/letters/)
    
    // Should show new request in list
    await expect(page.locator('table')).toContainText('BUSINESS')
  })

  test('should process letter request', async ({ page }) => {
    await page.goto('/letters')
    
    // Click process button for pending request
    await page.click('[data-testid="process-letter"]:first-child')
    
    // Should navigate to process page
    await expect(page).toHaveURL(/.*\/letters\/.*\/process/)
    
    // Should show request details
    await expect(page.locator('[data-testid="citizen-name"]')).toContainText(process.env.TEST_CITIZEN_NAME!)
    await expect(page.locator('[data-testid="letter-type"]')).toContainText('DOMICILE')
    
    // Select template
    await page.selectOption('select[name="template"]', 'domicile-standard')
    
    // Should show template preview
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible()
    
    // Process the letter
    await page.click('[data-testid="process-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Surat berhasil diproses')
    
    // Should update status to completed
    await page.goto('/letters')
    await expect(page.locator('table')).toContainText('COMPLETED')
  })

  test('should reject letter request', async ({ page }) => {
    await page.goto('/letters')
    
    // Click reject button
    await page.click('[data-testid="reject-letter"]:first-child')
    
    // Should show rejection dialog
    await expect(page.locator('[data-testid="reject-dialog"]')).toBeVisible()
    
    // Fill rejection reason
    await page.fill('textarea[name="rejectionReason"]', 'Dokumen tidak lengkap')
    
    // Confirm rejection
    await page.click('[data-testid="confirm-reject"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Permohonan berhasil ditolak')
    
    // Should update status to rejected
    await expect(page.locator('table')).toContainText('REJECTED')
  })

  test('should download processed letter', async ({ page }) => {
    await page.goto('/letters')
    
    // Find completed letter and click download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-letter"]:first-child')
    
    // Should download PDF file
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/.*\.pdf/)
  })

  test('should filter letters by status', async ({ page }) => {
    await page.goto('/letters')
    
    // Filter by pending status
    await page.selectOption('select[name="status"]', 'PENDING')
    
    // Should show only pending letters
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('PENDING')
    }
    
    // Clear filter
    await page.selectOption('select[name="status"]', '')
  })

  test('should filter letters by type', async ({ page }) => {
    await page.goto('/letters')
    
    // Filter by domicile type
    await page.selectOption('select[name="letterType"]', 'DOMICILE')
    
    // Should show only domicile letters
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('DOMICILE')
    }
  })

  test('should search letters by citizen name', async ({ page }) => {
    await page.goto('/letters')
    
    // Search by citizen name
    await page.fill('input[placeholder*="Cari"]', process.env.TEST_CITIZEN_NAME!)
    await page.press('input[placeholder*="Cari"]', 'Enter')
    
    // Should show filtered results
    await expect(page.locator('table')).toContainText(process.env.TEST_CITIZEN_NAME!)
  })

  test('should manage letter templates', async ({ page }) => {
    await page.goto('/letters/templates')
    
    // Should show templates page
    await expect(page.locator('h1')).toContainText('Template Surat')
    
    // Should show templates list
    await expect(page.locator('[data-testid="templates-table"]')).toBeVisible()
    
    // Click add template
    await page.click('[data-testid="add-template-button"]')
    
    // Fill template form
    await page.fill('input[name="name"]', 'Test Template')
    await page.selectOption('select[name="letterType"]', 'DOMICILE')
    await page.fill('textarea[name="content"]', 'Template content with {nama} and {nik} variables')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Template berhasil dibuat')
    
    // Should show new template in list
    await expect(page.locator('table')).toContainText('Test Template')
  })

  test('should validate letter request form', async ({ page }) => {
    await page.goto('/letters/create')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-citizen"]')).toContainText('Penduduk harus dipilih')
    await expect(page.locator('[data-testid="error-letterType"]')).toContainText('Jenis surat harus dipilih')
    await expect(page.locator('[data-testid="error-purpose"]')).toContainText('Keperluan harus diisi')
  })
})