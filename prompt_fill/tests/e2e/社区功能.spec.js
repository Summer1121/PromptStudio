import { test, expect } from '@playwright/test';

test.describe('社区功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:10981'); // 假设前端运行在此端口
    // 等待数据加载
    await page.waitForSelector('text=提示词管理器');
  });

  test('点击分享按钮应弹出登录框（未登录状态）', async ({ page }) => {
    // 假设第一个模板被选中
    await page.click('[title="发布到市场"]');
    
    // 检查是否出现了登录弹窗
    const modalTitle = await page.textContent('h2:has-text("欢迎回来")');
    expect(modalTitle).toBe('欢迎回来');
  });

  test('点击市场按钮应进入市场页面', async ({ page }) => {
    await page.click('[title="提示词市场"]');
    
    // 检查市场标题
    const marketTitle = await page.textContent('h1:has-text("提示词市场")');
    expect(marketTitle).toBe('提示词市场');
  });

  test('点击同步按钮应提示登录（未登录状态）', async ({ page }) => {
    await page.click('[title="云端备份"]');
    
    const modalTitle = await page.textContent('h2:has-text("欢迎回来")');
    expect(modalTitle).toBe('欢迎回来');
  });
});
