import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

// Reports every violation in the log; only the worst fail the run for now.
async function scan(page: import('@playwright/test').Page, name: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of violations) {
    console.log(
      `A11Y ${name} [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`,
    );
  }
  return violations.filter(v => v.impact === 'critical');
}

test.describe('accessibility', () => {
  test('the home page and a holiday page have no critical violations', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const session = await signIn(context, 'A');
    await setUpHoliday(context, session);
    const page = await context.newPage();

    await page.goto('/');
    await expect(page.locator('a[href^="/christmas"]').first()).toBeVisible();
    const home = await scan(page, 'home');

    await page.locator('a[href^="/christmas"]').first().click();
    await expect(
      page.locator('a[href="/christmas/gift-list"]').first(),
    ).toBeVisible();
    const holiday = await scan(page, 'christmas');

    expect([...home, ...holiday].map(v => v.id)).toEqual([]);
    await context.close();
  });
});
