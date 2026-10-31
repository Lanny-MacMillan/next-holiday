import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Events are tasks in their own category on one shared page; check a few holidays
for (const [holiday, slug] of [
  ['Easter', 'easter'],
  ['Hanukkah', 'hanukkah'],
  ["Mother's Day", 'mothers-day'],
]) {
  test(`the ${holiday} events page saves an event, and ticking it off survives a reload`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session, holiday);
    const title = `Family brunch ${Date.now()}`;

    const page = await context.newPage();
    await page.goto(`/${slug}/events`);
    await page.getByRole('button', { name: /add new event/i }).click();
    await page.getByPlaceholder('Task Title*').fill(title);
    await page.getByRole('button', { name: 'Add Event', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('Upcoming Events (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByText(title).click();
    // The event only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText('Completed Events (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Completed Events (1)')).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await context.close();
  });
}
