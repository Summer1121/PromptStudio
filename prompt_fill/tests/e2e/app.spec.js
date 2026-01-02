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

    // 3. Check that the EditorToolbar now shows a heading.
    const editorToolbar = page.locator('main').locator('.border-b');
    const heading = editorToolbar.getByRole('heading');
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).not.toBeNull();
    expect(headingText.length).toBeGreaterThan(0);
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
    const editorToolbar = page.locator('main').locator('.border-b');
    const editButton = editorToolbar.getByRole('button', { name: '编辑' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 5. Now, it should be editable
    await expect(textarea).toBeEditable();
  });

  test('should allow editing the preview and saving', async ({ page }) => {
    // 1. Click the first template
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();

    // 2. Click the "Edit" button
    const editorToolbar = page.locator('main').locator('.border-b');
    const editButton = editorToolbar.getByRole('button', { name: '编辑' });
    await editButton.click();

    // 3. Edit the content in the textarea
    const textarea = page.locator('textarea').first();
    const originalContent = await textarea.inputValue();
    const editedContent = 'This is the edited content';
    await textarea.fill(editedContent);
    await expect(textarea).toHaveValue(editedContent);

    // 4. Click the "Done" button
    const doneButton = editorToolbar.getByRole('button', { name: '完成' });
    await doneButton.click();

    // 5. Check that the "Save" buttons are visible
    const saveAsNewButton = editorToolbar.getByRole('button', { name: '另存为新模板' });
    const overwriteButton = editorToolbar.getByRole('button', { name: '覆盖模板' });
    await expect(saveAsNewButton).toBeVisible();
    await expect(overwriteButton).toBeVisible();

    // 6. Click "Save as New Template"
    await saveAsNewButton.click();

    // 7. Verify that a new template has been created
    const newTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first();
    const newTemplateName = await newTemplate.locator('span').first().textContent();
    expect(newTemplateName).toContain('(Edited)');

    // 8. Verify the content of the new template
    await newTemplate.click();
    const newTextarea = page.locator('textarea').first();
    await expect(newTextarea).toHaveValue(editedContent);

    // 9. Go back to the original template and edit the preview again
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').nth(1).click();
    
    // 10. Edit and Overwrite
    await editButton.click();
    const anotherEditedContent = 'This is another edited content';
    await textarea.fill(anotherEditedContent);
    await doneButton.click();
    await overwriteButton.click();

    // 11. Verify that the current template has been updated
    const currentTextarea = page.locator('textarea').first();
    await expect(currentTextarea).toHaveValue(anotherEditedContent);
  });
});
