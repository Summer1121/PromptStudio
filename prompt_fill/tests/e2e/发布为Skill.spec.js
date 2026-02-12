import { test, expect } from '@playwright/test';

test.describe('发布为 Skill 功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // 确保有模板被选中
    const firstInGrid = page.locator('.grid.grid-cols-1.gap-2\.5 > div').first();
    if (await firstInGrid.isVisible()) {
      await firstInGrid.click();
      await page.waitForTimeout(500);
    }

    // 配置 LLM (如果尚未配置)
    const settingsBtn = page.getByTitle('设置');
    await settingsBtn.click();
    await page.waitForTimeout(300);
    await page.locator('select[name="modelType"]').selectOption('gemini');
    await page.locator('input[name="apiKey"]').fill('test-key-for-e2e');
    await page.getByRole('button', { name: /保存|Save/ }).click();
    await page.waitForTimeout(500);
  });

  test('点击「保存为 Skill」应弹出模态框并开始分析', async ({ page }) => {
    // 找到「保存为 Skill」按钮 (在编辑器工具栏中)
    const saveAsSkillBtn = page.getByRole('button', { name: '保存为 Skill' });
    if (!await saveAsSkillBtn.isVisible()) {
      // 某些情况下可能在更多菜单里或者还未加载
      await page.waitForTimeout(1000);
    }
    await expect(saveAsSkillBtn).toBeVisible();
    await saveAsSkillBtn.click();

    // 检查模态框是否弹出
    await expect(page.locator('h2', { hasText: '保存为 Skill' })).toBeVisible();
    
    // 检查是否在分析中
    await expect(page.getByText('AI 正在分析提示词并生成 Skill 代码...')).toBeVisible();
  });

  test('MCP 资源中心应能删除 Skill', async ({ page }) => {
    // 1. 打开 MCP 资源中心
    await page.getByTitle('MCP 资源中心').click();
    await page.waitForTimeout(1000);
    
    // 2. 切换到「我的技能」标签
    await page.getByRole('button', { name: '我的技能 (Skills)' }).click();
    
    // 3. 检查是否有技能，如果没有则跳过或先创建一个 (此处假设已有技能)
    const skillItem = page.locator('.group.w-full.text-left').first();
    if (await skillItem.isVisible()) {
      const skillName = await skillItem.locator('.font-medium').innerText();
      
      // 4. 点击删除按钮 (hover 后显示)
      await skillItem.hover();
      const deleteBtn = skillItem.getByTitle('删除技能');
      await expect(deleteBtn).toBeVisible();
      
      // 准备处理确认弹窗 (Tauri confirm)
      const dialogPromise = page.waitForEvent('dialog');
      await deleteBtn.click();
      const dialog = await dialogPromise;
      await dialog.accept();
      
      // 5. 验证技能已被删除
      await expect(page.locator('.font-medium', { hasText: skillName })).not.toBeVisible();
    }
  });
});
