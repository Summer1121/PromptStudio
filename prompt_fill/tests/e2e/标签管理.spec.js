import { test, expect } from '@playwright/test';

test.describe('标签管理测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for data to load
    await page.waitForTimeout(5000); 
  });

  test('应允许在弹窗中创建、重命名和删除标签', async ({ page }) => {
    const newTagName = `E2E-创建-${Date.now()}`;
    const renamedTagName = `E2E-重命名-${Date.now()}`;

    // 1. Click the "Manage Tags" button in the sidebar
    await page.getByRole('button', { name: '管理标签' }).click();

    // 2. Check that the modal is visible
    const modal = page.locator('.fixed.inset-0').filter({ hasText: '管理标签' });
    await expect(modal).toBeVisible();

    // 3. Add a new tag
    await modal.getByPlaceholder('添加新标签').fill(newTagName);
    await modal.locator('button:has(svg.lucide-plus)').click();
    
    // 4. Verify the new tag appears in the list
    const newTagRow = modal.locator('div > .flex', { hasText: newTagName });
    await expect(newTagRow).toBeVisible();

    // 5. Rename the tag
    await newTagRow.getByRole('button').first().click(); // Assume first button is edit
    const renameInput = modal.locator(`input[value="${newTagName}"]`);
    await expect(renameInput).toBeVisible();
    await renameInput.fill(renamedTagName);
    await renameInput.press('Enter');

    // 6. Verify the tag is renamed
    await expect(modal.getByText(newTagName)).not.toBeVisible();
    const renamedTagRow = modal.locator('div > .flex', { hasText: renamedTagName });
    await expect(renamedTagRow).toBeVisible();

    // 7. Delete the tag
    await renamedTagRow.getByRole('button').last().click(); // Assume last button is delete

    // 8. Verify the tag is deleted
    await expect(modal.getByText(renamedTagName)).not.toBeVisible();

    // 9. Close the modal
    await modal.getByRole('button').first().click(); // Assuming 'X' is the first button
    await expect(modal).not.toBeVisible();
  });
});
