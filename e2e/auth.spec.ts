import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /acceso/i })).toBeVisible();
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible();
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    const password = process.env.TEST_PASSWORD || 'test123';

    await page.getByPlaceholder(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /panel general/i })).toBeVisible();
  });

  test('should show error on invalid password', async ({ page }) => {
    await page.getByPlaceholder(/contraseña/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/contraseña incorrecta/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should persist session across navigation', async ({ page }) => {
    const password = process.env.TEST_PASSWORD || 'test123';

    await page.getByPlaceholder(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL('/dashboard');

    await page.goto('/dashboard/recordatorios');
    await expect(page).toHaveURL('/dashboard/recordatorios');

    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });
});
