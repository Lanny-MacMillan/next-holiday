import { expect, test } from '@playwright/test';
import { call, setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// One guest list page serves every holiday that has one, so check each of them
for (const [holiday, slug] of [
  ['Birthday', 'birthday'],
  ['Graduation', 'graduation'],
  ['Fourth of July', 'fourth-of-july'],
  ['Thanksgiving', 'thanksgiving'],
  ['Baby Shower', 'baby-shower'],
]) {
  test(`the ${holiday} guest list keeps the RSVP chosen, when adding and when editing`, async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    const { holidayId } = await setUpHoliday(context, session, holiday);
    const guest = `Guest ${Date.now()}`;

    const status = async () => {
      const { body } = await call(
        context,
        session,
        'GET',
        `/api/holidays/${holidayId}/guest-lists`,
      );
      const lists: { rsvpStatus: string; contact: { name: string } }[] =
        body.data?.data ?? body.data ?? [];
      return lists.find(g => g.contact.name === guest)?.rsvpStatus;
    };

    const page = await context.newPage();
    await page.goto(`/${slug}/guest-list`);
    await page.getByRole('button', { name: /add new guest/i }).click();
    await page.getByPlaceholder('Guest Name*').fill(guest);
    await page.locator('select').selectOption('confirmed');
    await page.getByRole('button', { name: 'Add Guest', exact: true }).click();
    await expect(page.getByText(guest)).toBeVisible();
    expect(await status()).toBe('confirmed');

    await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await expect(page.locator('select')).toHaveValue('confirmed');
    await page.getByRole('button', { name: 'Update Guest', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Update Guest' })).toHaveCount(0);
    expect(await status()).toBe('confirmed');

    await page.reload();
    await expect(page.getByText(guest)).toBeVisible();
    await context.close();
  });
}
