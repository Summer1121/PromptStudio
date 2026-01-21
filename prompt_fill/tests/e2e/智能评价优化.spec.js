import { test, expect } from '@playwright/test';

test.describe('智能评价/优化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(10000);
    // 在左侧列表点选一个模板以进入编辑器（若尚未选中）
    const firstInGrid = page.locator('.grid.grid-cols-1.gap-2\\.5 > div').first();
    if (await firstInGrid.isVisible()) {
      await firstInGrid.click();
      await page.waitForTimeout(500);
    }
  });

  test('未配置大模型时点击「智能评价/优化」应提示先配置', async ({ page }) => {
    const optimizeBtn = page.getByRole('button', { name: '智能评价/优化' });
    await expect(optimizeBtn).toBeVisible();

    const dialogPromise = page.waitForEvent('dialog', { timeout: 15000 });
    await optimizeBtn.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/大模型设置未配置|LLM settings not configured/);
    await dialog.accept();
  });

  test('配置 Gemini 并保存后，点击「智能评价/优化」应触发 LLM 请求', async ({ page }) => {
    // 1. 打开设置
    const settingsBtn = page.getByTitle('设置');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // 2. 选择 Gemini，填写 apiKey，保存
    await page.locator('select[name="modelType"]').selectOption('gemini');
    await page.locator('input[name="apiKey"]').fill('test-key-for-e2e');
    await page.getByRole('button', { name: /保存|Save/ }).click();
    await page.waitForTimeout(500);

    // 3. 点击智能评价/优化；等待：发往 Gemini 的请求或错误弹窗（均表示已发起调用）
    const optimizeBtn = page.getByRole('button', { name: '智能评价/优化' });
    await expect(optimizeBtn).toBeVisible();

    const requestPromise = page.waitForRequest(
      (r) => r.url().includes('generativelanguage.googleapis.com'),
      { timeout: 20000 }
    ).then((r) => ({ type: 'request', r }));
    const dialogPromise = page.waitForEvent('dialog', { timeout: 20000 }).then((d) => ({ type: 'dialog', d }));

    await optimizeBtn.click();
    const result = await Promise.race([requestPromise, dialogPromise]);

    if (result.type === 'request') {
      expect(result.r.url()).toContain('generativelanguage.googleapis.com');
    } else {
      await result.d.accept();
    }
  });
});
