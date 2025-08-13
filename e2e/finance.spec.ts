import { test, expect } from '@playwright/test'

test.describe('Finance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login')
    await page.fill('[data-testid="username"]', 'admin')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test.describe('Budget Management', () => {
    test('should display budget list', async ({ page }) => {
      await page.goto('/finance/budgets')
      
      await expect(page.locator('h1')).toContainText('Anggaran Desa')
      await expect(page.locator('[data-testid="budget-table"]')).toBeVisible()
      
      // Check if add budget button is visible
      await expect(page.locator('[data-testid="add-budget-button"]')).toBeVisible()
    })

    test('should create new budget', async ({ page }) => {
      await page.goto('/finance/budgets')
      
      // Click add budget button
      await page.click('[data-testid="add-budget-button"]')
      
      // Fill budget form
      await page.fill('[data-testid="budget-category"]', 'Pembangunan')
      await page.fill('[data-testid="budget-subcategory"]', 'Infrastruktur Jalan')
      await page.fill('[data-testid="budget-amount"]', '50000000')
      await page.fill('[data-testid="budget-description"]', 'Perbaikan jalan desa')
      
      // Submit form
      await page.click('[data-testid="submit-budget"]')
      
      // Check success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Anggaran berhasil ditambahkan')
    })

    test('should validate budget form', async ({ page }) => {
      await page.goto('/finance/budgets')
      await page.click('[data-testid="add-budget-button"]')
      
      // Submit empty form
      await page.click('[data-testid="submit-budget"]')
      
      // Check validation errors
      await expect(page.locator('[data-testid="category-error"]')).toContainText('Kategori harus diisi')
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Jumlah harus diisi')
    })

    test('should edit existing budget', async ({ page }) => {
      await page.goto('/finance/budgets')
      
      // Click edit button on first budget
      await page.click('[data-testid="edit-budget-0"]')
      
      // Update budget amount
      await page.fill('[data-testid="budget-amount"]', '75000000')
      
      // Submit form
      await page.click('[data-testid="submit-budget"]')
      
      // Check success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Anggaran berhasil diperbarui')
    })
  })

  test.describe('Expense Management', () => {
    test('should display expense list', async ({ page }) => {
      await page.goto('/finance/expenses')
      
      await expect(page.locator('h1')).toContainText('Realisasi Anggaran')
      await expect(page.locator('[data-testid="expense-table"]')).toBeVisible()
    })

    test('should create new expense', async ({ page }) => {
      await page.goto('/finance/expenses')
      
      await page.click('[data-testid="add-expense-button"]')
      
      // Fill expense form
      await page.selectOption('[data-testid="budget-item"]', '1')
      await page.fill('[data-testid="expense-amount"]', '5000000')
      await page.fill('[data-testid="expense-date"]', '2024-01-15')
      await page.fill('[data-testid="expense-description"]', 'Pembelian material')
      
      // Upload receipt
      await page.setInputFiles('[data-testid="expense-receipt"]', 'e2e/fixtures/receipt.pdf')
      
      await page.click('[data-testid="submit-expense"]')
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Pengeluaran berhasil dicatat')
    })

    test('should require approval for large expenses', async ({ page }) => {
      await page.goto('/finance/expenses')
      await page.click('[data-testid="add-expense-button"]')
      
      // Create large expense
      await page.selectOption('[data-testid="budget-item"]', '1')
      await page.fill('[data-testid="expense-amount"]', '25000000')
      await page.fill('[data-testid="expense-date"]', '2024-01-15')
      await page.fill('[data-testid="expense-description"]', 'Pembelian peralatan besar')
      
      await page.click('[data-testid="submit-expense"]')
      
      // Check if expense is pending approval
      await expect(page.locator('[data-testid="approval-notice"]')).toContainText('Menunggu persetujuan')
    })
  })

  test.describe('Aid Programs', () => {
    test('should display aid programs', async ({ page }) => {
      await page.goto('/finance/aid-programs')
      
      await expect(page.locator('h1')).toContainText('Program Bantuan')
      await expect(page.locator('[data-testid="aid-programs-table"]')).toBeVisible()
    })

    test('should create new aid program', async ({ page }) => {
      await page.goto('/finance/aid-programs')
      
      await page.click('[data-testid="add-program-button"]')
      
      // Fill program form
      await page.fill('[data-testid="program-name"]', 'Bantuan Sembako')
      await page.selectOption('[data-testid="program-type"]', 'SOCIAL')
      await page.fill('[data-testid="program-budget"]', '100000000')
      await page.fill('[data-testid="program-description"]', 'Program bantuan sembako untuk keluarga kurang mampu')
      
      await page.click('[data-testid="submit-program"]')
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Program bantuan berhasil dibuat')
    })

    test('should add beneficiaries to aid program', async ({ page }) => {
      await page.goto('/finance/aid-programs')
      
      // Click on first program
      await page.click('[data-testid="view-program-0"]')
      
      // Add beneficiary
      await page.click('[data-testid="add-beneficiary-button"]')
      
      // Search and select citizen
      await page.fill('[data-testid="citizen-search"]', 'John Doe')
      await page.click('[data-testid="citizen-option-0"]')
      
      await page.fill('[data-testid="aid-amount"]', '500000')
      await page.click('[data-testid="add-beneficiary-submit"]')
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Penerima bantuan berhasil ditambahkan')
    })
  })

  test.describe('Financial Reports', () => {
    test('should generate budget report', async ({ page }) => {
      await page.goto('/finance/reports')
      
      // Select report type
      await page.selectOption('[data-testid="report-type"]', 'budget')
      
      // Set date range
      await page.fill('[data-testid="start-date"]', '2024-01-01')
      await page.fill('[data-testid="end-date"]', '2024-12-31')
      
      // Generate report
      await page.click('[data-testid="generate-report"]')
      
      // Check if report is displayed
      await expect(page.locator('[data-testid="report-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-summary"]')).toBeVisible()
    })

    test('should export report to PDF', async ({ page }) => {
      await page.goto('/finance/reports')
      
      await page.selectOption('[data-testid="report-type"]', 'expense')
      await page.fill('[data-testid="start-date"]', '2024-01-01')
      await page.fill('[data-testid="end-date"]', '2024-12-31')
      await page.click('[data-testid="generate-report"]')
      
      // Wait for report to load
      await expect(page.locator('[data-testid="report-content"]')).toBeVisible()
      
      // Start download
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-pdf"]')
      const download = await downloadPromise
      
      // Check if file is downloaded
      expect(download.suggestedFilename()).toContain('laporan-keuangan')
      expect(download.suggestedFilename()).toContain('.pdf')
    })
  })

  test.describe('Financial Analytics', () => {
    test('should display financial charts', async ({ page }) => {
      await page.goto('/finance/analytics')
      
      // Check if charts are visible
      await expect(page.locator('[data-testid="budget-vs-actual-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="expense-by-category-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="monthly-spending-chart"]')).toBeVisible()
    })

    test('should filter analytics by date range', async ({ page }) => {
      await page.goto('/finance/analytics')
      
      // Change date range
      await page.fill('[data-testid="analytics-start-date"]', '2024-06-01')
      await page.fill('[data-testid="analytics-end-date"]', '2024-12-31')
      await page.click('[data-testid="apply-filter"]')
      
      // Check if charts update
      await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-vs-actual-chart"]')).toBeVisible()
    })
  })
})