import { test } from '@playwright/test';
import { shareChristmas } from './support/share';

test('a Plus user invites someone by email and they get access after accepting', async ({
  browser,
}) => {
  const { contextA, contextB } = await shareChristmas(browser);

  await contextA.close();
  await contextB.close();
});
