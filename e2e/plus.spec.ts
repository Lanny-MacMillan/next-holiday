import { expect, test } from '@playwright/test';
import { setPlan, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test.describe('Plus features', () => {
  test('a free user has no Invite button until they upgrade', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session);
    await setPlan(context, session, 'free');

    const page = await context.newPage();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /christmas/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Invite', exact: true }),
    ).toHaveCount(0);

    await setPlan(context, session, 'plus');

    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Invite', exact: true }),
    ).toBeVisible();
    await context.close();
  });
});
