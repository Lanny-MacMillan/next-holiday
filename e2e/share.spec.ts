import { test } from '@playwright/test';
import { call, setUpHoliday, setUpUser } from './support/api';
import { signIn } from './support/auth';

test('explore sharing', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const a = await signIn(ctxA, 'A');
  await setUpHoliday(ctxA, a);
  const ctxB = await browser.newContext();
  const b = await signIn(ctxB, 'B');
  await setUpUser(ctxB, b);

  const pageA = await ctxA.newPage();
  const log = (tag: string) => (r: import('@playwright/test').Response) =>
    r.url().includes('/api/invites') &&
    console.log(
      tag,
      r.status(),
      r.request().method(),
      r.url().replace('http://localhost:3000', ''),
    );
  pageA.on('response', log('A-API'));
  await pageA.goto('/');
  await pageA.locator('a[href^="/christmas"]').first().click();
  await pageA.waitForTimeout(3000);
  console.log(
    'A-BUTTONS',
    (await pageA.getByRole('button').allInnerTexts()).join(' | '),
  );
  await pageA.getByRole('button', { name: 'Invite', exact: true }).click();
  await pageA.getByPlaceholder('Enter email address or user ID').fill(b.email);
  await pageA.getByRole('button', { name: 'Send Invite' }).click();
  await pageA.waitForTimeout(3000);
  console.log(
    'A-BODY',
    (await pageA.locator('body').innerText()).replace(/\n+/g, ' / ').slice(0, 400),
  );

  const pageB = await ctxB.newPage();
  pageB.on('response', log('B-API'));
  await pageB.goto('/');
  await pageB.waitForTimeout(4000);
  await pageB.getByRole('button', { name: 'Notifications' }).click();
  await pageB.waitForTimeout(2000);
  console.log(
    'B-BODY',
    (await pageB.locator('body').innerText()).replace(/\n+/g, ' / ').slice(0, 600),
  );
  console.log(
    'B-BUTTONS',
    (await pageB.getByRole('button').allInnerTexts()).join(' | '),
  );
  await pageB.screenshot({ path: 'test-results/b-notifications.png' });
  void call;
});
