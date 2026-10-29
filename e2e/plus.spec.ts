import { expect, test } from '@playwright/test';
import { call, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test.describe('Plus features', () => {
  test('a free user has no Invite button until they upgrade', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session);

    const page = await context.newPage();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /christmas/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Invite', exact: true }),
    ).toHaveCount(0);

    const upgraded = await call(context, session, 'POST', '/api/upgrade-user', {
      auth0Sub: session.sub,
      plan: 'plus',
    });
    expect(upgraded.status).toBe(200);

    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Invite', exact: true }),
    ).toBeVisible();
    await context.close();
  });
});
