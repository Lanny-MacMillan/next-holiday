import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Pages that keep their items as tasks in a category of their own
for (const [holiday, slug, noun, pending, completed] of [
  [
    'Halloween',
    'halloween/costume-ideas',
    'costume idea',
    'Pending Costume Ideas',
    'Completed Costume Ideas',
  ],
  ['Baby Shower', 'baby-shower/games', 'game', 'Incomplete', 'Completed'],
  ['Anniversary', 'anniversary/date-ideas', 'date idea', 'Incomplete', 'Completed'],
  [
    'New Year',
    'new-year/resolution-tracker',
    'resolution',
    'Pending Resolutions',
    'Completed Resolutions',
  ],
]) {
  test(`the ${noun} page saves an item, and ticking it off survives a reload`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session, holiday);
    const title = `Idea ${Date.now()}`;

    const page = await context.newPage();
    await page.goto(`/${slug}`);
    await page
      .getByRole('button', { name: new RegExp(`add new ${noun}`, 'i') })
      .click();
    await page.getByPlaceholder('Task Title*').fill(title);
    await page
      .getByRole('button', { name: new RegExp(`^add ${noun}$`, 'i') })
      .click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(`${pending} (1)`)).toBeVisible();

    await page.reload();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByText(title).click();
    // The item only moves once the server has saved it, so reloading after this is safe
    await expect(page.getByText(`${completed} (1)`)).toBeVisible();

    await page.reload();
    await expect(page.getByText(`${completed} (1)`)).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await context.close();
  });
}

test('the suggested trick-or-treat tasks appear on the page once added', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, 'Halloween');

  const page = await context.newPage();
  await page.goto('/halloween/trick-or-treat-prep');
  await page.getByRole('button', { name: 'Add Suggested Tasks' }).click();

  await expect(page.getByText('Buy Halloween Candy')).toBeVisible();
  await expect(page.getByText('Pending Trick-or-Treat Prep (4)')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Pending Trick-or-Treat Prep (4)')).toBeVisible();
  await context.close();
});

test("the reservations page offers Valentine's starter list, and adding it fills the page", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  await setUpHoliday(context, session, "Valentine's Day");

  const page = await context.newPage();
  await page.goto('/valentines/reservations');
  await expect(page.getByText("💖 Set Up Valentine's Reservations")).toBeVisible();
  await page.getByRole('button', { name: 'Add Default Reservations' }).click();

  await expect(page.getByText("Valentine's Restaurant Reservation")).toBeVisible();
  await expect(page.getByText('Pending Reservations (10)')).toBeVisible();

  await page.getByText("Valentine's Restaurant Reservation").click();
  // The reservation only moves once the server has saved it, so reloading after this is safe
  await expect(page.getByText('Confirmed Reservations (1)')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Pending Reservations (9)')).toBeVisible();
  await expect(page.getByText('Confirmed Reservations (1)')).toBeVisible();
  await context.close();
});
