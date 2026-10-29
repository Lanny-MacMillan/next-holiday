import { expect, type Browser } from '@playwright/test';
import { call, setPlan, setUpHoliday, setUpUser } from './api';
import { signIn } from './auth';

// User A (Plus) invites user B to their Christmas by email and B accepts,
// leaving both signed in with B a member of A's share. The test users are
// shared across specs, so if B already belongs to A's share nothing is repeated.
export async function shareChristmas(browser: Browser) {
  const contextA = await browser.newContext();
  const a = await signIn(contextA, 'A');
  const { holidayId } = await setUpHoliday(contextA, a);
  await setPlan(contextA, a, 'plus');

  const contextB = await browser.newContext();
  const b = await signIn(contextB, 'B');
  await setUpUser(contextB, b);
  const giftsUrl = `/api/holidays/${holidayId}/gifts`;

  const before = (await call(contextB, b, 'GET', giftsUrl)).status;
  if (before !== 200) {
    expect(before).toBe(403);
    const pageA = await contextA.newPage();
    await pageA.goto('/');
    await pageA.getByRole('button', { name: 'Invite', exact: true }).click();
    await pageA.getByPlaceholder('Enter email address or user ID').fill(b.email);
    await pageA.getByRole('button', { name: 'Send Invite' }).click();
    await expect(pageA.getByText('Invite Sent', { exact: true })).toBeVisible();

    const pageB = await contextB.newPage();
    await pageB.goto('/');
    await pageB.getByRole('button', { name: 'Notifications' }).click();
    await expect(
      pageB.getByText(/invited you to collaborate on Christmas/).first(),
    ).toBeVisible();
    await pageB.getByRole('button', { name: 'Accept', exact: true }).first().click();
    await pageB.getByRole('button', { name: /accept & replace my data/i }).click();

    await expect
      .poll(async () => (await call(contextB, b, 'GET', giftsUrl)).status)
      .toBe(200);
  }

  return { contextA, a, contextB, b, holidayId, giftsUrl };
}
