import { expect, test } from '@playwright/test';
import { call, setUpHoliday, setUpUser } from './support/api';
import { signIn } from './support/auth';

test('a Plus user invites someone by email and they get access after accepting', async ({
  browser,
}) => {
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
  await pageB.getByRole('button', { name: 'Accept' }).first().click();

  await expect
    .poll(async () => (await call(contextB, b, 'GET', giftsUrl)).status)
    .toBe(200);

  await contextA.close();
  await contextB.close();
});
