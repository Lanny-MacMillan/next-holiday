import { test } from '@playwright/test';
import { setUpHoliday } from './support/api';
import { signIn } from './support/auth';

test('explore the add-gift form', async ({ browser }) => {
  const context = await browser.newContext();
  const session = await signIn(context, 'A');
  const ids = await setUpHoliday(context, session);
  console.log('SETUP', JSON.stringify(ids));

  const page = await context.newPage();
  page.on(
    'console',
    m => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)),
  );
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 300)));
  page.on(
    'response',
    r =>
      r.url().includes('/api/') &&
      console.log(
        'API',
        r.status(),
        r.request().method(),
        r.url().replace('http://localhost:3000', ''),
      ),
  );
  await page.goto('/christmas/gift-list');
  await page.waitForTimeout(8000);
  console.log('BODY', (await page.locator('body').innerText()).slice(0, 300));
  await page.getByRole('button', { name: /add new gift/i }).click({ timeout: 5000 });

  const fields = await page
    .locator('input, textarea, select, button')
    .evaluateAll(nodes =>
      nodes.map(n => {
        const e = n as HTMLInputElement;
        return `${e.tagName} type=${e.type} name=${e.name} id=${e.id} ph=${e.placeholder} text=${(e.textContent || '').trim().slice(0, 30)}`;
      }),
    );
  console.log('FIELDS\n' + fields.join('\n'));
  await page.screenshot({ path: 'test-results/gift-form.png', fullPage: true });
  await context.close();
});
