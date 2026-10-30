import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test('a few suggestions can be picked from the meal planning list, and the rest stay on offer', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Thanksgiving');

  const page = await context.newPage();
  await page.goto('/thanksgiving/meal-planning');
  await expect(page.getByText('🍽️ Set Up Meal Planning')).toBeVisible();
  await page.getByRole('button', { name: 'Choose suggestions' }).click();

  const picker = page.getByRole('dialog', { name: 'Suggested meal planning tasks' });
  await expect(picker.getByText('10 of 10 selected')).toBeVisible();
  await picker.getByRole('button', { name: 'Clear' }).click();
  await picker
    .getByRole('checkbox', { name: /Plan Traditional Turkey Menu/ })
    .check();
  await picker.getByRole('checkbox', { name: /Create Cooking Timeline/ }).check();
  await picker.getByRole('button', { name: 'Add 2 selected' }).click();

  await expect(page.getByText('Plan Traditional Turkey Menu')).toBeVisible();
  await expect(page.getByText('Create Cooking Timeline')).toBeVisible();
  await expect(page.getByText('Dessert Planning')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: '💡 Suggestions (8)' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText('Plan Traditional Turkey Menu')).toBeVisible();
  await page.getByRole('button', { name: '💡 Suggestions (8)' }).click();
  const again = page.getByRole('dialog', { name: 'Suggested meal planning tasks' });
  await expect(again.getByText('Already added')).toHaveCount(2);
  await again.getByRole('button', { name: 'Cancel' }).click();
  await context.close();
});

test('skipping the suggestions on an empty page keeps the prompt away but the button stays', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Birthday');

  const page = await context.newPage();
  await page.goto('/birthday/party-planning');
  await expect(page.getByText('Get Started with Party Planning')).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByText('Get Started with Party Planning')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Choose suggestions' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: '💡 Suggestions (8)' }),
  ).toBeVisible();
  await context.close();
});
