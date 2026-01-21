import { test, expect } from '@playwright/test';

test.describe('高级交互与目录功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL before each test.
    await page.goto('/');
    // Wait for the app to fully load, including data from local storage.
    await page.waitForTimeout(5000); 
  });

  test('编辑模式下修改内容应立即显示保存按钮', async ({ page }) => {
    await page.locator('.group.flex-col').first().click();
    const editorToolbar = page.locator('main').locator('.border-b');
    await editorToolbar.getByRole('button', { name: '编辑' }).click();

    const overwriteButton = editorToolbar.getByRole('button', { name: '覆盖模板' });
    await expect(overwriteButton).not.toBeVisible();

    await page.locator('textarea').first().press('a');
    await expect(overwriteButton).toBeVisible();
  });

  test('预览模式下修改内容应立即显示保存按钮', async ({ page }) => {
    await page.locator('.group.flex-col').first().click();
    const editorToolbar = page.locator('main').locator('.border-b');
    const overwriteButton = editorToolbar.getByRole('button', { name: '覆盖模板' });
    await expect(overwriteButton).not.toBeVisible();
    
    const previewArea = page.locator('pre[contenteditable="true"]');
    await previewArea.focus();
    await previewArea.press('a');
    
    await expect(overwriteButton).toBeVisible();
  });
  
  test('应能通过多个标签筛选模板', async ({ page }) => {
    const templatesContainer = page.locator('.space-y-4').first();
    const initialVisibleTemplates = await templatesContainer.locator('.group.flex-col').count();
    
    await page.getByRole('button', { name: '选择标签' }).click();
    
    await page.getByLabel('主题').getByText('人物').click();
    await page.getByLabel('风格').getByText('卡通').click();
    
    await page.getByRole('heading', { name: '提示词管理器' }).click();
    
    const filteredCount = await templatesContainer.locator('.group.flex-col').count();
    expect(filteredCount).toBeLessThan(initialVisibleTemplates);
    
    await page.getByRole('button', { name: '已选择 2 个标签' }).click();
    await page.getByRole('button', { name: '清除选择' }).click();
    
    const finalCount = await templatesContainer.locator('.group.flex-col').count();
    expect(finalCount).toEqual(initialVisibleTemplates);
  });
  
  test('分配多个标签后，模板应出现在多个目录中', async ({ page }) => {
    const templateName = '角色概念分解图';
    const firstTemplate = page.locator('.group.flex-col', { hasText: templateName }).first();
    await firstTemplate.click();

    await page.locator('main').locator('.border-b').getByRole('button').filter({ has: page.locator('svg.lucide-tag') }).click();
    
    await page.getByRole('button', { name: '风格/卡通' }).click();

    // Verify in "主题" directory
    const themeDirectory = page.locator('div:not(.ml-4)').filter({ has: page.getByRole('button', { name: '主题' }) });
    const templateInTheme = themeDirectory.locator('.group.flex-col', { hasText: templateName }).first();
    await expect(templateInTheme).toBeVisible();

    // Verify in "风格" -> "卡通" directory
    const styleDirectory = page.locator('div:not(.ml-4)').filter({ has: page.getByRole('button', { name: '风格' }) });
    const styleHeaderButton = styleDirectory.getByRole('button', { name: '风格' });
    const isStyleOpen = await styleHeaderButton.locator('svg').getAttribute('class');
    if (!isStyleOpen.includes('rotate-90')) {
      await styleHeaderButton.click();
    }
    const cartoonDirectory = styleDirectory.locator('div.ml-4').filter({ has: page.getByRole('button', { name: '卡通' }) });
    const templateInCartoon = cartoonDirectory.locator('.group.flex-col', { hasText: templateName });
    await expect(templateInCartoon).toBeVisible();
  });

  test('点击“一键收起”应折叠所有目录', async ({ page }) => {
    const themeDirectory = page.locator('div:not(.ml-4)').filter({ has: page.getByRole('button', { name: '主题' }) });
    const themeContent = themeDirectory.locator('.grid').first();
    await expect(themeContent).toBeVisible();

    await page.getByTitle('一键收起').click();

    await expect(themeContent).not.toBeVisible();
  });
});
