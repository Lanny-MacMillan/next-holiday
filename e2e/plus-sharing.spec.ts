import { expect, test } from '@playwright/test';
import { call, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test('sharing is refused for a free account and allowed once it has Plus', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session);
  // The test users are shared across specs, so make sure this one starts free
  const downgraded = await call(context, session, 'POST', '/api/upgrade-user', {
    auth0Sub: session.sub,
    plan: 'free',
  });
  expect(downgraded.status).toBe(200);

  const free = await call(context, session, 'POST', '/api/shares', {
    holidayKey: 'christmas',
  });
  expect(free.status).toBe(403);

  const invite = await call(context, session, 'POST', '/api/invites', {
    shareId: 'any',
    holidayKey: 'christmas',
    toEmail: 'someone@example.com',
  });
  expect(invite.status).toBe(403);

  const upgraded = await call(context, session, 'POST', '/api/upgrade-user', {
    auth0Sub: session.sub,
    plan: 'plus',
  });
  expect(upgraded.status).toBe(200);

  const plus = await call(context, session, 'POST', '/api/shares', {
    holidayKey: 'christmas',
  });
  expect(plus.status).toBe(200);
  await context.close();
});
