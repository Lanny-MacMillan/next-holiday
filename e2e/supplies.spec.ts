import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Supplies lists are the shared gift list with a form that has no recipient
for (const [holiday, slug] of [
  ['New Year', 'new-year'],
  ['Fourth of July', 'fourth-of-july'],
]) {
  test(`the ${holiday} supplies list saves a supply with just a name, and ticking it off survives a reload`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session, holiday);
    const supply = `Streamers ${Date.now()}`;

    const page = await context.newPage();
    await page.goto(`/${slug}/supplies-list`);
    await page.getByRole('button', { name: /add new supply/i }).click();
    await page.getByPlaceholder('Item Name*').fill(supply);
    await page.getByRole('button', { name: 'Add Supply', exact: true }).click();
    await expect(page.getByText(supply)).toBeVisible();
    await expect(page.getByText('Incomplete (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText(supply)).toBeVisible();

    await page.getByText(supply).click();
    // The supply only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText('Completed (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Completed (1)')).toBeVisible();
    await expect(page.getByText(supply)).toBeVisible();
    await context.close();
  });
}
