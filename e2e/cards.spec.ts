import { expect, test } from '@playwright/test';
import { call, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test.describe('cards', () => {
  // One cards page serves every holiday that has one, so check more than Christmas
  for (const [holiday, slug] of [
    ['Christmas', 'christmas'],
    ['Birthday', 'birthday'],
    ["Valentine's Day", 'valentines'],
  ]) {
    test(`a user adds a ${holiday} card, marks it sent, and both survive a reload`, async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const session = await signIn(context, 'A');
      await setUpHoliday(context, session, holiday);
      const recipient = `Aunt Rose ${Date.now()}`;

      const page = await context.newPage();
      await page.goto(`/${slug}/cards`);

      await page.getByRole('button', { name: /add new card/i }).click();
      await page.getByPlaceholder('Recipient*').fill(recipient);
      await page.getByPlaceholder('Message*').fill('Warm wishes!');
      await page.getByRole('button', { name: 'Add Card', exact: true }).click();
      await expect(page.getByText(recipient)).toBeVisible();

      await page.reload();
      await expect(page.getByText(recipient)).toBeVisible();

      await page.getByRole('button', { name: 'Mark Sent' }).first().click();
      // The card only moves once the server has saved it, so reloading after this is safe
      await expect(page.getByText('Sent Cards (1)')).toBeVisible();

      await page.reload();
      await expect(page.getByText('Sent Cards (1)')).toBeVisible();
      await expect(page.getByText(recipient)).toBeVisible();
      await context.close();
    });
  }

  test('cards are listed by recipient', async ({ browser }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    const { holidayId } = await setUpHoliday(context, session, "Mother's Day");
    const stamp = Date.now();
    for (const name of [`Zed ${stamp}`, `Abe ${stamp}`]) {
      const created = await call(
        context,
        session,
        'POST',
        `/api/holidays/${holidayId}/cards`,
        { recipient: name, message: 'Hello' },
      );
      expect(created.status).toBeLessThan(300);
    }

    const page = await context.newPage();
    await page.goto('/mothers-day/cards');
    await expect(page.getByText(`Abe ${stamp}`)).toBeVisible();

    const text = await page.locator('main').innerText();
    expect(text.indexOf(`Abe ${stamp}`)).toBeLessThan(text.indexOf(`Zed ${stamp}`));
    await context.close();
  });
});
