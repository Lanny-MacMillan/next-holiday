import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// One tasks page serves every holiday; they keep tasks in different categories
// (Christmas shows all of them, Halloween uses To-Do), so check one of each.
for (const [holiday, slug] of [
  ['Christmas', 'christmas'],
  ['Birthday', 'birthday'],
  ['Halloween', 'halloween'],
]) {
  test(`the ${holiday} tasks page saves a task, and ticking it off survives a reload`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session, holiday);
    const title = `Wrap presents ${Date.now()}`;

    const page = await context.newPage();
    await page.goto(`/${slug}/tasks`);
    await page.getByRole('button', { name: /add new task/i }).click();
    await page.getByPlaceholder('Task Title*').fill(title);
    await page.getByRole('button', { name: 'Add Task', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('Incomplete (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByText(title).click();
    // The task only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText('Completed (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Completed (1)')).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await context.close();
  });
}
