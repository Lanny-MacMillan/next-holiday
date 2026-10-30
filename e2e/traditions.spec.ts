import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Adding a holiday with traditional items brings the items with it, once
test('a new Hanukkah has its eight candle nights, and adding it again adds no more', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Hanukkah');
  await setUpHoliday(context, session, 'Hanukkah');

  const page = await context.newPage();
  await page.goto('/hanukkah/candle-lighting');

  await expect(page.getByText('Light 1st Candle')).toBeVisible();
  await expect(page.getByText('Light 8th Candle')).toBeVisible();
  await expect(page.getByText('Light 1st Candle')).toHaveCount(1);
  await expect(page.getByText('Add Default Tasks')).toHaveCount(0);

  await page.reload();
  await expect(page.getByText('Light 1st Candle')).toHaveCount(1);
  await context.close();
});

test('a new Kwanzaa has its seven principles', async ({ browser }) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Kwanzaa');

  const page = await context.newPage();
  await page.goto('/kwanzaa/daily-principles');

  await expect(page.getByText('Umoja (Unity)')).toBeVisible();
  await expect(page.getByText('Imani (Faith)')).toBeVisible();
  await expect(page.getByText('Add Default Principles')).toHaveCount(0);
  await context.close();
});
