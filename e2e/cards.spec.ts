import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test.describe('cards', () => {
  test('a user adds a card, marks it sent, and both survive a reload', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session);
    const recipient = `Aunt Rose ${Date.now()}`;

    const page = await context.newPage();
    await page.goto('/christmas/cards');

    await page.getByRole('button', { name: /add new card/i }).click();
    await page.getByPlaceholder('Recipient*').fill(recipient);
    await page.getByPlaceholder('Message*').fill('Merry Christmas!');
    await page.getByRole('button', { name: 'Add Card', exact: true }).click();
    await expect(page.getByText(recipient)).toBeVisible();

    await page.reload();
    await expect(page.getByText(recipient)).toBeVisible();

    await page.getByRole('button', { name: 'Mark Sent' }).first().click();
    // The card only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText('Sent Cards (1)')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Mark Sent' })).toHaveCount(0);
    await expect(page.getByText(recipient)).toBeVisible();
    await context.close();
  });
});
