import { expect, type Browser } from '@playwright/test';
import { call, setUpHoliday, setUpUser } from './api';
import { signIn } from './auth';

// User A (Plus) invites user B to their Christmas by email and B accepts,
// leaving both signed in with B a member of A's share.
export async function shareChristmas(browser: Browser) {
  const contextA = await browser.newContext();
  const a = await signIn(contextA, 'A');
  const { holidayId } = await setUpHoliday(contextA, a);
  const upgraded = await call(contextA, a, 'POST', '/api/upgrade-user', {
    auth0Sub: a.sub,
    plan: 'plus',
  });
  expect(upgraded.status).toBe(200);

  const contextB = await browser.newContext();
  const b = await signIn(contextB, 'B');
  await setUpUser(contextB, b);
  const giftsUrl = `/api/holidays/${holidayId}/gifts`;
  expect((await call(contextB, b, 'GET', giftsUrl)).status).toBe(403);

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
    pageB.getByText(/invited you to collaborate on Christmas/),
  ).toBeVisible();
  await pageB.getByRole('button', { name: 'Accept', exact: true }).first().click();
  await pageB.getByRole('button', { name: /accept & replace my data/i }).click();

  await expect
    .poll(async () => (await call(contextB, b, 'GET', giftsUrl)).status)
    .toBe(200);

  return { contextA, a, contextB, b, holidayId, giftsUrl };
}
