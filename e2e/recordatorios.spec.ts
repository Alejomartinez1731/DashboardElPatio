import { test, expect } from '@playwright/test';

test.describe('Recordatorios (Reminders) Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const password = process.env.TEST_PASSWORD || 'test123';
    await page.getByPlaceholder(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/dashboard');
  });

  test('should navigate to reminders page', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await expect(page).toHaveURL('/dashboard/recordatorios');
    await expect(page.getByRole('heading', { name: /recordatorios/i })).toBeVisible();
  });

  test('should display reminder cards', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');

    // Wait for reminders to load
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    const cards = page.locator('[data-testid="reminder-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show manual reminders with different style', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Manual reminders should have blue/purple styling
    const manualReminders = page.locator('[data-testid="reminder-card"][data-type="manual"]');
    const manualCount = await manualReminders.count();

    if (manualCount > 0) {
      await expect(manualReminders.first()).toHaveClass(/border-blue/);
    }
  });

  test('should create a new manual reminder', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Click add reminder button
    await page.click('[data-testid="add-reminder-button"]');

    // Fill form
    await page.fill('[data-testid="reminder-product-input"]', 'Producto de Prueba E2E');
    await page.fill('[data-testid="reminder-days-input"]', '30');
    await page.fill('[data-testid="reminder-notes-input"]', 'Nota de prueba automatizada');

    // Submit
    await page.click('[data-testid="save-reminder-button"]');

    // Verify success message
    await expect(page.locator('text=/creado correctamente/i')).toBeVisible({ timeout: 5000 });

    // Verify new card appears
    await expect(page.locator('text=/Producto de Prueba E2E/i')).toBeVisible();
  });

  test('should validate reminder input', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');

    // Click add reminder button
    await page.click('[data-testid="add-reminder-button"]');

    // Try to submit without product
    await page.click('[data-testid="save-reminder-button"]');

    // Should show validation error
    await expect(page.locator('text=/requerido/i')).toBeVisible();
  });

  test('should delete a reminder', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Get count before deletion
    const cardsBefore = await page.locator('[data-testid="reminder-card"]').count();

    // Click delete on first reminder
    await page.locator('[data-testid="reminder-card"]').first().hover();
    await page.locator('[data-testid="delete-reminder-button"]').first().click();

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(500);

    // Verify count decreased
    const cardsAfter = await page.locator('[data-testid="reminder-card"]').count();
    expect(cardsAfter).toBeLessThan(cardsBefore);
  });

  test('should show reminder state colors', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Check for different state indicators
    const urgentCards = page.locator('[data-testid="reminder-card"][data-state="urgente"]');
    const warningCards = page.locator('[data-testid="reminder-card"][data-state="warning"]');
    const okCards = page.locator('[data-testid="reminder-card"][data-state="ok"]');

    // At least one state should be present
    const totalStates = await urgentCards.count() + await warningCards.count() + await okCards.count();
    expect(totalStates).toBeGreaterThan(0);
  });

  test('should filter reminders by search', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Get initial count
    const countBefore = await page.locator('[data-testid="reminder-card"]').count();

    // Type in search
    await page.fill('[data-testid="reminder-search"]', 'prueba');

    // Wait for filter
    await page.waitForTimeout(1000);

    // Count may be different
    const countAfter = await page.locator('[data-testid="reminder-card"]').count();
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('should display reminder details', async ({ page }) => {
    await page.click('[data-testid="nav-recordatorios"]');
    await page.waitForSelector('[data-testid="reminder-card"]', { timeout: 30000 });

    // Click on first reminder
    await page.locator('[data-testid="reminder-card"]').first().click();

    // Should show details modal
    await expect(page.locator('[data-testid="reminder-details-modal"]')).toBeVisible();
  });
});
