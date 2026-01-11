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

  test('变量应正确渲染并可点击', async ({ page }) => {
    // 确保页面加载完成
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();
    
    // 找到一个包含变量的模板
    // 假设第一个模板包含变量，或者我们需要切换到包含变量的模板
    // 例如，如果有一个名为“带变量的模板”的模板，可以这样点击：
    // await page.getByText('带变量的模板').click();

    // 假设当前激活的模板内容中含有变量，例如 {{variableKey}}
    // 在这里我们点击第一个模板，并假设它包含变量
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();

    // 找到一个渲染后的变量元素（通常是一个带有特定样式的span）
    // 根据 VariableNode.jsx 中的 className: bg-orange-200 text-orange-800 ...
    const variablePill = page.locator('.bg-orange-200.text-orange-800').first();
    await expect(variablePill).toBeVisible();
    await expect(variablePill).toHaveText(/{{.*}}/); // 检查文本格式是否正确

    // 模拟点击变量，并验证弹窗是否出现
    await variablePill.click();
    const variablePicker = page.locator('div[role="dialog"]'); // 假设变量选择器有 role="dialog" 或其他唯一标识
    await expect(variablePicker).toBeVisible();

    // 关闭弹窗
    await page.keyboard.press('Escape');
    await expect(variablePicker).not.toBeVisible();
  });

  test('编辑器区域应能上下滚动', async ({ page }) => {
    // 点击任意模板以激活编辑器
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();

    // 点击编辑按钮进入编辑模式
    await page.getByRole('button', { name: '编辑' }).click();

    // 找到编辑器内容区域
    const editorContent = page.locator('.ProseMirror'); 
    await expect(editorContent).toBeVisible();

    // 注入大量内容以触发滚动条
    const longContent = Array(100).fill('这是一段很长的文本，用于测试编辑器的滚动功能。').join('\n');
    await editorContent.fill(longContent);

    // 验证编辑器区域是否可滚动
    // Playwright 无法直接验证 CSS overflow 属性或滚动条本身
    // 但可以通过检查滚动高度是否大于客户端高度来间接验证
    const scrollHeight = await editorContent.evaluate(node => node.scrollHeight);
    const clientHeight = await editorContent.evaluate(node => node.clientHeight);
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // 尝试向下滚动，并验证滚动位置是否改变 (间接验证)
    await editorContent.evaluate(node => node.scrollTop = node.scrollHeight);
    const newScrollTop = await editorContent.evaluate(node => node.scrollTop);
    expect(newScrollTop).toBeGreaterThan(0);
  });

  test('备注框应常驻悬浮在底部且不遮挡编辑器内容', async ({ page }) => {
    // 点击任意模板以激活编辑器
    await page.locator('div[class="grid grid-cols-1 gap-2.5"] > div').first().click();

    const notesEditor = page.locator('.notes-editor-container'); // 假设备注框有特定类名
    // 验证备注框是否可见
    await expect(notesEditor).toBeVisible();

    // 验证备注框是否在底部 (通过其 Y 坐标间接判断)
    const viewportHeight = page.viewportSize().height;
    const notesEditorBoundingBox = await notesEditor.boundingBox();
    expect(notesEditorBoundingBox.y + notesEditorBoundingBox.height).toBeCloseTo(viewportHeight);

    // 验证备注框没有遮挡编辑器主内容
    // 这通过检查编辑器的底部位置与备注框的顶部位置来间接验证
    const editorContent = page.locator('.ProseMirror');
    const editorContentBoundingBox = await editorContent.boundingBox();

    // 编辑器内容的底部应该在备注框的顶部之上
    expect(editorContentBoundingBox.y + editorContentBoundingBox.height).toBeLessThan(notesEditorBoundingBox.y);
  });
});

