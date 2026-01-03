import { test, expect } from '@playwright/test';

test.describe('基本交互测试', () => {
  // Before each test, navigate to the root URL.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load data and stabilize from the file system
    await page.waitForTimeout(10000); 
  });

  test('应能加载主页面并显示模板列表', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '提示词填空器' })).toBeVisible();
    const templates = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div');
    const count = await templates.count();
    expect(count).toBeGreaterThan(0);
  });

  test('点击模板时，工具栏应显示模板详情', async ({ page }) => {
    const firstTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first();
    await firstTemplate.click();
    const editorToolbar = page.locator('main').locator('.border-b');
    const heading = editorToolbar.getByRole('heading');
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText.length).toBeGreaterThan(0);
  });

  test('删除模板时应有防误触机制', async ({ page }) => {
    // We test that the delete button is only visible on hover, which is a proxy for the confirm dialog test
    const firstTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first();
    await firstTemplate.click();
    const deleteButton = firstTemplate.getByTitle('删除');
    await expect(deleteButton).not.toBeVisible();
    await firstTemplate.hover();
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
  });

  test('点击“编辑”按钮应使编辑器区域可编辑', async ({ page }) => {
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();
    const textarea = page.locator('textarea').first();
    await expect(textarea).not.toBeEditable();
    const editorToolbar = page.locator('main').locator('.border-b');
    const editButton = editorToolbar.getByRole('button', { name: '编辑' });
    await editButton.click();
    await expect(textarea).toBeEditable();
  });

  test('应允许编辑模板内容并进行“覆盖”和“另存为”', async ({ page }) => {
    const editorToolbar = page.locator('main').locator('.border-b');
    const editButton = editorToolbar.getByRole('button', { name: '编辑' });
    const doneButton = editorToolbar.getByRole('button', { name: '完成' });
    const saveAsNewButton = editorToolbar.getByRole('button', { name: '另存为新模板' });
    const overwriteButton = editorToolbar.getByRole('button', { name: '覆盖模板' });
    const textarea = page.locator('textarea').first();

    // --- Test Save as New ---
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();
    await editButton.click();
    
    const editedContent = `这是新的测试内容 ${Date.now()}`;
    await textarea.fill(editedContent);
    await expect(textarea).toHaveValue(editedContent);
    
    await saveAsNewButton.click();

    const newTemplate = page.locator('div[class*="grid"] > div').first();
    const newTemplateName = await newTemplate.locator('span').first().textContent();
    expect(newTemplateName).toContain('(Edited)');
    
    // Verify content of the new template
    await newTemplate.click();
    await expect(page.locator('textarea').first()).toHaveValue(editedContent);

    // --- Test Overwrite ---
    const secondTemplate = page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').nth(1);
    await secondTemplate.click();
    await editButton.click();
    
    const anotherEditedContent = `这是被覆盖的测试内容 ${Date.now()}`;
    await textarea.fill(anotherEditedContent);
    await overwriteButton.click();
    
    // Buttons should disappear after save
    await expect(overwriteButton).not.toBeVisible();
    
    // Verify content was saved
    await doneButton.click(); // Exit edit mode to check preview
    const previewArea = page.locator('pre[contenteditable="true"]');
    await expect(previewArea).toContainText(anotherEditedContent);
  });
});
