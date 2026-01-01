import { test, expect } from '@playwright/test';

test.describe('Core App Functionality', () => {
  // Before each test, navigate to the root URL.
  // The webServer config in playwright.config.js will have started the app.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load data and stabilize from the file system
    await page.waitForTimeout(3000); 
  });

  test('should load the main page and display templates', async ({ page }) => {
    // 1. Check for the main title from the sidebar
    await expect(page.getByRole('heading', { name: '提示词填空器' })).toBeVisible();

    // 2. Check that the template list has items
    const templates = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div');
    const count = await templates.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display template details in the toolbar when a template is clicked', async ({ page }) => {
    // 1. Get the name of the first template in the list
    const firstTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first();
    const templateName = await firstTemplate.locator('span').first().textContent();

    // 2. Click the first template
    await firstTemplate.click();

    // 3. Check that the EditorToolbar now shows the correct template name
    const editorToolbar = page.locator('.h-16.border-b');
    await expect(editorToolbar.getByRole('heading', { name: templateName })).toBeVisible();
  });

  test('should show a native confirm dialog when deleting a template', async ({ page }) => {
    // Playwright can't handle Tauri's native dialogs directly.
    // Instead, we test that the button that would trigger it is visible and enabled.
    
    // 1. Click the first template to make its buttons visible
    const firstTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first();
    await firstTemplate.click();

    // 2. Hover over the template to make the delete button appear
    await firstTemplate.hover();

    // 3. Find the "delete" button (identified by its title) *within the scope of the first template*
    const deleteButton = firstTemplate.getByTitle('删除');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
  });

  test('clicking Edit button should make the editor area editable', async ({ page }) => {
    // 1. Click the first template
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();

    // 2. Get the editor textarea
    const textarea = page.locator('textarea').first();
    
    // 3. Initially, it should be read-only
    await expect(textarea).not.toBeEditable();

    // 4. Find and click the "Edit" button within the toolbar
    const editorToolbar = page.locator('.h-16.border-b');
    const editButton = editorToolbar.getByRole('button', { name: '编辑' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 5. Now, it should be editable
    await expect(textarea).toBeEditable();
  });
});
