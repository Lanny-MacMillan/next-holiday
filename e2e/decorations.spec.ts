import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Decorations are tasks in their own category on one shared page; check a few holidays
for (const [holiday, slug] of [
  ['Thanksgiving', 'thanksgiving'],
  ['Halloween', 'halloween'],
  ['Easter', 'easter'],
]) {
  test(`the ${holiday} decorations page saves a decoration, and ticking it off survives a reload`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session, holiday);
    const title = `Hang lights ${Date.now()}`;

    const page = await context.newPage();
    await page.goto(`/${slug}/decorations`);
    await page.getByRole('button', { name: /add new decoration/i }).click();
    await page.getByPlaceholder('Task Title*').fill(title);
    await page.getByRole('button', { name: 'Add Decoration', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('Pending Decorations (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByText(title).click();
    // The decoration only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText('Completed Decorations (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Completed Decorations (1)')).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await context.close();
  });
}

test('a new Kwanzaa already has its ten traditional decorations', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Kwanzaa');

  const page = await context.newPage();
  await page.goto('/kwanzaa/decorations');

  await expect(page.getByText('Kinara Candle Holder Setup')).toBeVisible();
  await expect(page.getByText('Pending Decorations (10)')).toBeVisible();
  await expect(page.getByText(/Set Up Kwanzaa Decorations/)).toHaveCount(0);
  await context.close();
});
