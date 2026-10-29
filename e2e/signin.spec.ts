import { expect, test } from '@playwright/test';
import { signIn } from './support/auth';

test.describe('signing in with a real Auth0 token', () => {
  test('the API accepts the token and creates the user', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const { idToken, email } = await signIn(context, 'A');

    const created = await context.request.post(`${baseURL}/api/users`, {
      headers: { Authorization: `Bearer ${idToken}` },
      data: {},
    });
    expect(created.ok()).toBeTruthy();

    const me = await context.request.get(`${baseURL}/api/users/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    expect(me.ok()).toBeTruthy();
    expect(JSON.stringify(await me.json())).toContain(email);
    await context.close();
  });

  test('the API refuses a request with no token', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/users/me`);
    expect(response.status()).toBe(401);
  });

  test('the app shows the signed-in user instead of the login prompt', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await signIn(context, 'A');
    const page = await context.newPage();
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: /log ?in|sign ?in/i }),
    ).toHaveCount(0, { timeout: 20_000 });
    await context.close();
  });
});
