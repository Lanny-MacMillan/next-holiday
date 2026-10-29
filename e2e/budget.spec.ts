import { expect, test, type Page } from '@playwright/test';
import { call, setPlan, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

const budgetCard = (page: Page) =>
  page
    .locator('div.card')
    .filter({ has: page.getByRole('heading', { name: 'Christmas Budget' }) });

async function setUp(browser: import('@playwright/test').Browser, plus: boolean) {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  const { accountId, holidayId } = await setUpHoliday(context, session);
  await setPlan(context, session, plus ? 'plus' : 'free');
  const budget = await call(context, session, 'POST', '/api/holidays/preferences', {
    accountId,
    preferences: [{ holiday: 'Christmas', budget: 200 }],
  });
  expect(budget.status).toBeLessThan(300);

  const names: Record<string, number> = {
    [`Scarf ${Date.now()}`]: 50,
    [`Gloves ${Date.now()}`]: 30,
    [`Coat ${Date.now()}`]: 300,
  };
  for (const [name, price] of Object.entries(names)) {
    const created = await call(
      context,
      session,
      'POST',
      `/api/holidays/${holidayId}/gifts`,
      { name, recipient: 'Grandma', price },
    );
    expect(created.status).toBeLessThan(300);
  }
  return { context, names: Object.keys(names) };
}

test.describe('budget tracking', () => {
  test('a Plus user sees spent and remaining move as gifts are ticked off', async ({
    browser,
  }) => {
    const { context, names } = await setUp(browser, true);
    const [scarf, gloves, coat] = names;

    const page = await context.newPage();
    await page.goto('/christmas/gift-list');
    await expect(page.getByText(scarf)).toBeVisible();

    const card = budgetCard(page);
    await expect(card).toContainText('Budget: $200.00');
    await expect(card).toContainText('Spent: $0.00');
    await expect(card).toContainText('Remaining: $200.00');
    await expect(card).toContainText('Plenty of budget left');

    await page.getByText(scarf).click();
    await expect(card).toContainText('Spent: $50.00');
    await expect(card).toContainText('Remaining: $150.00');
    await expect(card).toContainText('25.0% used');

    await page.getByText(gloves).click();
    await expect(card).toContainText('Spent: $80.00');
    await expect(card).toContainText('40.0% used');

    await page.getByText(scarf).click();
    await expect(card).toContainText('Spent: $30.00');

    await page.getByText(coat).click();
    await expect(card).toContainText('Spent: $330.00');
    await expect(card).toContainText('Remaining: $-130.00');
    await expect(card).toContainText('Over budget!');

    await page.reload();
    await expect(budgetCard(page)).toContainText('Spent: $330.00');
    await context.close();
  });

  test('a free user does not get the budget display', async ({ browser }) => {
    const { context, names } = await setUp(browser, false);

    const page = await context.newPage();
    await page.goto('/christmas/gift-list');
    await expect(page.getByText(names[0])).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Christmas Budget' }),
    ).toHaveCount(0);
    await context.close();
  });
});
