import { expect, test } from '@playwright/test';
import { call } from './support/api';
import { shareChristmas } from './support/share';

test('a gift assigned to a member of a shared holiday shows for both of them', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { contextA, a, contextB, b, giftsUrl } = await shareChristmas(browser);
  const gift = `Mug ${Date.now()}`;

  const bUser = await call(
    contextB,
    b,
    'GET',
    `/api/users/by-auth0-sub?sub=${encodeURIComponent(b.sub)}`,
  );
  expect(bUser.status).toBe(200);

  const pageA = await contextA.newPage();
  await pageA.goto('/christmas/gift-list');
  await pageA.getByRole('button', { name: /add new gift/i }).click();
  await pageA.getByPlaceholder('Recipient*').fill('Grandma');
  await pageA.getByPlaceholder('Gift Name*').fill(gift);
  await pageA.locator('select').selectOption(bUser.body.id);
  await pageA.getByRole('button', { name: 'Add Gift', exact: true }).click();
  await expect(pageA.getByText(gift)).toBeVisible();
  await expect(pageA.getByText(/Assigned to:/)).toBeVisible();

  const saved = await call(contextA, a, 'GET', giftsUrl);
  const stored = (saved.body.data?.data ?? saved.body.data).find(
    (g: { name: string }) => g.name === gift,
  );
  expect(stored.assignedTo).toBe(bUser.body.id);

  const pageB = await contextB.newPage();
  await pageB.goto('/christmas/gift-list');
  await expect(pageB.getByText(gift)).toBeVisible();
  await expect(pageB.getByText(/Assigned to:/)).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test("a member of a shared holiday sees the owner's cards", async ({ browser }) => {
  test.setTimeout(120_000);
  const { contextA, a, contextB, holidayId } = await shareChristmas(browser);
  const recipient = `Cousin Kit ${Date.now()}`;
  const created = await call(
    contextA,
    a,
    'POST',
    `/api/holidays/${holidayId}/cards`,
    {
      recipient,
      message: 'Happy holidays',
    },
  );
  expect(created.status).toBeLessThan(300);

  const pageB = await contextB.newPage();
  await pageB.goto('/christmas/cards');
  await expect(pageB.getByText(recipient)).toBeVisible();

  await contextA.close();
  await contextB.close();
});
