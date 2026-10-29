import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test.describe('production hardening', () => {
  test('the health check answers without a token', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok', config: 'ok' },
    });
  });

  test('pages carry the security headers', async ({ request, baseURL }) => {
    const headers = (await request.get(`${baseURL}/`)).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBeTruthy();
    expect(headers['content-security-policy-report-only']).toContain(
      "frame-ancestors 'none'",
    );
  });

  test('a normal signed-in visit breaks no Content Security Policy rule', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session);

    const page = await context.newPage();
    const violations: string[] = [];
    page.on('console', message => {
      if (/content security policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });

    await page.goto('/');
    await page.locator('a[href^="/christmas"]').first().click();
    await page.locator('a[href="/christmas/gift-list"]').first().click();
    await expect(page.getByRole('button', { name: /add new gift/i })).toBeVisible();

    expect(violations).toEqual([]);
    await context.close();
  });
});
