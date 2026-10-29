import type { BrowserContext } from '@playwright/test';

export type Session = { idToken: string; sub: string; email: string; name: string };

const BASE = 'http://localhost:3000';

export async function call(
  context: BrowserContext,
  session: Session,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
) {
  const response = await context.request.fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${session.idToken}` },
    data,
  });
  const text = await response.text();
  return { status: response.status(), body: text ? JSON.parse(text) : null };
}

export async function setUpUser(context: BrowserContext, session: Session) {
  await call(context, session, 'POST', '/api/users', { name: session.name });
  await call(context, session, 'POST', '/api/users/setup', {
    auth0User: { sub: session.sub, email: session.email, name: session.name },
  });
  const home = await call(context, session, 'GET', '/api/home');
  return home.body.data.account.id as string;
}

// Brings a brand-new user to the state of someone who has picked a holiday.
export async function setUpHoliday(
  context: BrowserContext,
  session: Session,
  holiday = 'Christmas',
) {
  const accountId = await setUpUser(context, session);

  await call(context, session, 'POST', '/api/holidays/preferences', {
    accountId,
    preferences: [{ holiday }],
  });

  const after = await call(context, session, 'GET', '/api/home');
  const preference = after.body.data.holidayPreferences.find(
    (p: { holiday: string }) => p.holiday === holiday,
  );
  return { accountId, holidayId: preference.holidayId as string };
}

// The test users are shared across specs, so a spec that depends on the plan sets it first.
export async function setPlan(
  context: BrowserContext,
  session: Session,
  plan: 'free' | 'plus',
) {
  const response = await call(context, session, 'POST', '/api/upgrade-user', {
    auth0Sub: session.sub,
    plan,
  });
  if (response.status !== 200) throw new Error(`Could not set plan to ${plan}`);
}
