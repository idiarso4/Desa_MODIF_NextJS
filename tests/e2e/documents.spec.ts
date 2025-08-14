/**
 * Document Generation E2E Tests
 * Tests for PDF document generation workflows
 */

import { test, expect } from '@playwright/test'

test.describe('Document Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should navigate to document generator', async ({ page }) => {
    // Navigate to documents page
    await page.click('text=Dokumen')
    await page.click('text=Generator Dokumen')
    
    await expect(page).toHaveURL('/documents/generate')
    await expect(page.locator('h1')).toContainText('Generator Dokumen')
  })

  test('should display document generation form', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Check if form elements are present
    await expect(page.locator('select[name="type"]')).toBeVisible()
    await expect(page.locator('select[name="citizenId"]')).toBeVisible()
    await expect(page.locator('textarea[name="purpose"]')).toBeVisible()
    await expect(page.locator('button:has-text("Preview")')).toBeVisible()
    await expect(page.locator('button:has-text("Generate & Download")')).toBeVisible()
  })

  test('should generate domicile certificate', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Fill form for domicile certificate
    await page.selectOption('select[name="type"]', 'domicileCertificate')
    await page.selectOption('select[name="citizenId"]', { index: 1 }) // Select first citizen
    await page.fill('textarea[name="purpose"]', 'Keperluan administrasi bank')
    await page.fill('input[name="validUntil"]', '2024-12-31')
    
    // Generate document
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Generate & Download")')
    const download = await downloadPromise
    
    // Check download
    expect(download.suggestedFilename()).toContain('domicileCertificate')
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('should generate business certificate', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Fill form for business certificate
    await page.selectOption('select[name="type"]', 'businessCertificate')
    await page.selectOption('select[name="citizenId"]', { index: 1 })
    await page.fill('textarea[name="purpose"]', 'Pengajuan kredit usaha')
    
    // Fill business-specific fields
    await page.fill('input[name="businessType"]', 'Warung Kelontong')
    await page.fill('input[name="businessAddress"]', 'Jl. Merdeka No. 123')
    await page.fill('input[name="businessStartDate"]', '2020-01-01')
    
    // Generate document
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Generate & Download")')
    const download = await downloadPromise
    
    // Check download
    expect(download.suggestedFilename()).toContain('businessCertificate')
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('should preview document before download', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Fill form
    await page.selectOption('select[name="type"]', 'domicileCertificate')
    await page.selectOption('select[name="citizenId"]', { index: 1 })
    await page.fill('textarea[name="purpose"]', 'Preview test')
    
    // Click preview
    await page.click('button:has-text("Preview")')
    
    // Should show preview iframe
    await expect(page.locator('iframe[title="Document Preview"]')).toBeVisible()
    await expect(page.locator('h3:has-text("Preview Dokumen")')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Try to generate without filling required fields
    await page.click('button:has-text("Generate & Download")')
    
    // Should show validation errors
    await expect(page.locator('text=Pilih jenis dokumen')).toBeVisible()
    await expect(page.locator('text=Pilih warga')).toBeVisible()
    await expect(page.locator('text=Tujuan harus diisi')).toBeVisible()
  })

  test('should show business fields for business certificate', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Select business certificate type
    await page.selectOption('select[name="type"]', 'businessCertificate')
    
    // Business-specific fields should appear
    await expect(page.locator('input[name="businessType"]')).toBeVisible()
    await expect(page.locator('input[name="businessAddress"]')).toBeVisible()
    await expect(page.locator('input[name="businessStartDate"]')).toBeVisible()
  })

  test('should hide business fields for other document types', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Select domicile certificate type
    await page.selectOption('select[name="type"]', 'domicileCertificate')
    
    // Business-specific fields should not be visible
    await expect(page.locator('input[name="businessType"]')).not.toBeVisible()
    await expect(page.locator('input[name="businessAddress"]')).not.toBeVisible()
  })

  test('should handle generation errors gracefully', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Fill form with invalid citizen ID (if possible to simulate)
    await page.selectOption('select[name="type"]', 'domicileCertificate')
    // Simulate selecting invalid citizen through browser console
    await page.evaluate(() => {
      const select = document.querySelector('select[name="citizenId"]') as HTMLSelectElement
      if (select) {
        const option = document.createElement('option')
        option.value = 'invalid-id'
        option.text = 'Invalid Citizen'
        select.appendChild(option)
        select.value = 'invalid-id'
      }
    })
    
    await page.fill('textarea[name="purpose"]', 'Test error handling')
    
    // Try to generate
    await page.click('button:has-text("Generate & Download")')
    
    // Should show error message
    await expect(page.locator('text=Gagal generate dokumen')).toBeVisible()
  })

  test('should display document information cards', async ({ page }) => {
    await page.goto('/documents/generate')
    
    // Check information cards
    await expect(page.locator('text=Surat Keterangan Domisili')).toBeVisible()
    await expect(page.locator('text=Surat Keterangan Usaha')).toBeVisible()
    await expect(page.locator('text=Surat Keterangan Tidak Mampu')).toBeVisible()
    
    // Check usage instructions
    await expect(page.locator('text=Cara Penggunaan')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/documents/generate')
    
    // Check if form is properly displayed on mobile
    await expect(page.locator('select[name="type"]')).toBeVisible()
    await expect(page.locator('textarea[name="purpose"]')).toBeVisible()
    
    // Check if information cards stack properly on mobile
    const cards = page.locator('[data-testid="info-card"]')
    if (await cards.count() > 0) {
      await expect(cards.first()).toBeVisible()
    }
  })
})
