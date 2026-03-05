#!/usr/bin/env node

/**
 * Script to fix cold entry issues in all holiday pages
 * Updates holiday pages to use shouldSkipHolidayQueryWithColdEntry for proper cold entry handling
 */

const fs = require('fs');
const path = require('path');

const holidayRoutes = [
  '/christmas',
  '/hanukkah',
  '/kwanzaa',
  '/new-year',
  '/valentines',
  '/easter',
  '/halloween',
  '/thanksgiving',
  '/mothers-day',
  '/fathers-day',
  '/fourth-of-july',
  '/birthday',
  '/anniversary',
  '/graduation',
  '/baby-shower',
];

function updateHolidayPage(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add import for shouldSkipHolidayQueryWithColdEntry if not present
  if (
    content.includes('shouldSkipHolidayQuery') &&
    !content.includes('shouldSkipHolidayQueryWithColdEntry')
  ) {
    content = content.replace(
      /import { shouldSkipHolidayQuery } from "@\/utils\/holidayData";/,
      'import { shouldSkipHolidayQuery, shouldSkipHolidayQueryWithColdEntry } from "@/utils/holidayData";',
    );
    modified = true;
  }

  // Fix the holidayId resolution logic
  const holidayIdPattern =
    /const holidayId = homeInitialized\s*\?\s*getHolidayIdFromRoute\([^)]+\)\s*:\s*null;/;
  if (holidayIdPattern.test(content)) {
    content = content.replace(
      holidayIdPattern,
      'const holidayId = homeInitialized\n\t\t? getHolidayIdFromRoute("/holiday", holidayPreferences)\n\t\t: getHolidayIdFromRoute("/holiday", holidayPreferences); // Allow fallback for cold entry',
    );
    modified = true;
  }

  // Replace shouldSkipHolidayQuery calls with shouldSkipHolidayQueryWithColdEntry
  const skipPattern =
    /shouldSkipHolidayQuery\(holidayId, auth0User, currentState\)/g;
  if (skipPattern.test(content)) {
    content = content.replace(
      skipPattern,
      'shouldSkipHolidayQueryWithColdEntry(holidayId, auth0User, currentState, true)',
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

function main() {
  console.log('Fixing cold entry issues in holiday pages...\n');

  holidayRoutes.forEach(route => {
    const pagePath = path.join(
      __dirname,
      '..',
      'src',
      'app',
      route.replace('/', ''),
      'page.tsx',
    );
    updateHolidayPage(pagePath);
  });

  console.log('\nCold entry fixes completed!');
}

if (require.main === module) {
  main();
}

module.exports = { updateHolidayPage };
