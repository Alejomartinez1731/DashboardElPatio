import { test, expect } from '@playwright/test';

test.describe('Dashboard Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const password = process.env.TEST_PASSWORD || 'test123';
    await page.getByPlaceholder(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/dashboard');
  });

  test('should load dashboard with KPIs', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="kpi-card"]', { timeout: 30000 });

    // Check that KPIs are displayed
    const kpiCards = page.locator('[data-testid="kpi-card"]');
    await expect(kpiCards).toHaveCount(4);

    // Check each KPI has a value
    await expect(page.locator('text=/gasto total/i')).toBeVisible();
    await expect(page.locator('text=/gasto quincenal/i')).toBeVisible();
    await expect(page.locator('text=/compras mes/i')).toBeVisible();
  });

  test('should handle n8n connection failure gracefully', async ({ page }) => {
    // Intercept n8n requests to simulate failure
    await page.route('**/api/sheets', route => route.abort());

    await page.goto('/dashboard');

    // Should show warning message
    await expect(page.locator('text=/datos de prueba/i')).toBeVisible({ timeout: 10000 });
  });

  test('should display data table with rows', async ({ page }) => {
    // Wait for data table
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 30000 });

    const table = page.locator('[data-testid="data-table"]');
    await expect(table).toBeVisible();

    // Check that table has rows
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for loading indicator
    const loading = page.locator('[data-testid="loading-spinner"]');
    await expect(loading).toBeVisible();
  });

  test('should filter data by date range', async ({ page }) => {
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 30000 });

    // Click date filter
    await page.click('[data-testid="date-filter"]');

    // Select last 30 days
    await page.click('text=/últimos 30 días/i');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify table updated
    const table = page.locator('[data-testid="data-table"]');
    await expect(table).toBeVisible();
  });

  test('should search by product name', async ({ page }) => {
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 30000 });

    // Type in search box
    await page.fill('[data-testid="search-input"]', 'lechuga');

    // Wait for results
    await page.waitForTimeout(1000);

    // Verify search was performed
    const table = page.locator('[data-testid="data-table"]');
    await expect(table).toBeVisible();
  });

  test('should export data to Excel', async ({ page }) => {
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 30000 });

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv)$/);
  });

  test('should switch between tabs', async ({ page }) => {
    await page.waitForSelector('[data-testid="kpi-card"]', { timeout: 30000 });

    // Click on "Histórico Precios" tab
    await page.click('[data-testid="tab-historico_precios"]');

    // Verify tab is active
    await expect(page.locator('[data-testid="tab-historico_precios"].active')).toBeVisible();

    // Click on "Base de Datos" tab
    await page.click('[data-testid="tab-base_de_datos"]');

    // Verify tab is active
    await expect(page.locator('[data-testid="tab-base_de_datos"].active')).toBeVisible();
  });
});
