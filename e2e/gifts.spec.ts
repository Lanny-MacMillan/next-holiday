import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { call, setUpHoliday, type Session } from './support/api';
import { signIn } from './support/auth';

async function openGiftList(page: Page, slug = 'christmas') {
  await page.goto(`/${slug}/gift-list`);
}

async function giftNames(
  context: BrowserContext,
  session: Session,
  holidayId: string,
) {
  const { body } = await call(
    context,
    session,
    'GET',
    `/api/holidays/${holidayId}/gifts`,
  );
  return (body.data?.data ?? body.data ?? []).map((g: { name: string }) => g.name);
}

test.describe('gifts', () => {
  test('a signed-in user adds a gift and it is still there after a reload', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    const { holidayId } = await setUpHoliday(context, session);
    const gift = `Scarf ${Date.now()}`;

    const page = await context.newPage();
    await openGiftList(page);
    await page.getByRole('button', { name: /add new gift/i }).click();
    await page.getByPlaceholder('Recipient*').fill('Grandma');
    await page.getByPlaceholder('Gift Name*').fill(gift);
    await page.getByPlaceholder('Price').fill('25');
    await page.getByRole('button', { name: 'Add Gift', exact: true }).click();

    await expect(page.getByText(gift)).toBeVisible();
    expect(await giftNames(context, session, holidayId)).toContain(gift);

    await page.reload();
    await expect(page.getByText(gift)).toBeVisible();
    await context.close();
  });

  // The gift list is one shared page; check it works for more than Christmas
  for (const [holiday, slug] of [
    ['Birthday', 'birthday'],
    ['Halloween', 'halloween'],
    ["Mother's Day", 'mothers-day'],
  ]) {
    test(`the ${holiday} gift list saves a gift across a reload`, async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const session = await signIn(context, 'A');
      const { holidayId } = await setUpHoliday(context, session, holiday);
      const gift = `Book ${Date.now()}`;

      const page = await context.newPage();
      await openGiftList(page, slug);
      await page.getByRole('button', { name: /add new gift/i }).click();
      await page.getByPlaceholder('Recipient*').fill('Grandma');
      await page.getByPlaceholder('Gift Name*').fill(gift);
      await page.getByRole('button', { name: 'Add Gift', exact: true }).click();

      await expect(page.getByText(gift)).toBeVisible();
      expect(await giftNames(context, session, holidayId)).toContain(gift);

      await page.reload();
      await expect(page.getByText(gift)).toBeVisible();
      await context.close();
    });
  }

  test("another user cannot read or remove someone else's gift", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const a = await signIn(contextA, 'A');
    const holidayA = await setUpHoliday(contextA, a);
    const created = await call(
      contextA,
      a,
      'POST',
      `/api/holidays/${holidayA.holidayId}/gifts`,
      { name: `Private ${Date.now()}`, recipient: 'Grandma', price: 10 },
    );
    expect(created.status).toBeLessThan(300);
    const giftId = (created.body.data?.data ?? created.body.data).id as string;

    const contextB = await browser.newContext();
    const b = await signIn(contextB, 'B');
    const holidayB = await setUpHoliday(contextB, b);

    const read = await call(
      contextB,
      b,
      'GET',
      `/api/holidays/${holidayA.holidayId}/gifts`,
    );
    expect(read.status).toBe(403);

    const viaOwnHoliday = await call(
      contextB,
      b,
      'DELETE',
      `/api/holidays/${holidayB.holidayId}/gifts?giftId=${giftId}`,
    );
    expect(viaOwnHoliday.status).not.toBe(200);

    const stillThere = await call(
      contextA,
      a,
      'GET',
      `/api/holidays/${holidayA.holidayId}/gifts`,
    );
    expect(JSON.stringify(stillThere.body)).toContain(giftId);

    await contextA.close();
    await contextB.close();
  });
});

test.describe('opening a holiday page directly', () => {
  test('a fresh session loads the page instead of staying on the spinner', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    const { holidayId } = await setUpHoliday(context, session);
    const gift = `Mittens ${Date.now()}`;
    const created = await call(
      context,
      session,
      'POST',
      `/api/holidays/${holidayId}/gifts`,
      { name: gift, recipient: 'Grandpa', price: 12 },
    );
    expect(created.status).toBeLessThan(300);

    const page = await context.newPage();
    await page.goto('/christmas/gift-list');

    await expect(page.getByText(gift)).toBeVisible();
    await context.close();
  });
});
