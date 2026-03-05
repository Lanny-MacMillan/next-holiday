#!/usr/bin/env node

/**
 * Script to update all holiday pages with Redux-first pattern
 * Run with: node scripts/update-holiday-pages.js
 */

const fs = require('fs');
const path = require('path');

const HOLIDAY_PAGES = [
  'src/app/birthday/page.tsx',
  'src/app/baby-shower/page.tsx',
  'src/app/mothers-day/page.tsx',
  'src/app/thanksgiving/page.tsx',
  'src/app/fathers-day/page.tsx',
  'src/app/easter/page.tsx',
  'src/app/graduation/page.tsx',
  'src/app/valentines/page.tsx',
  'src/app/halloween/page.tsx',
  'src/app/anniversary/page.tsx',
  'src/app/fourth-of-july/page.tsx',
];

const IMPORT_ADDITION = `import { shouldSkipHolidayQuery } from "@/utils/holidayData";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";`;

const HOOKS_REPLACEMENT = `	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/{HOLIDAY}", holidayPreferences)
		: null;

	// Get data from Redux home state first, fallback to RTK Query if needed
	const homeData = useAppSelector(selectHomeData);
	
	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Use RTK Query only if home data is not available or incomplete
	const shouldFetchFromAPI = !homeInitialized || !homeData?.holidayPreferences?.length;`;

const SKIP_PATTERN = /{ skip: !holidayId \|\| !auth0User }/g;
const SKIP_REPLACEMENT =
  '{ skip: shouldSkipHolidayQuery(holidayId, auth0User, currentState) }';

function updateHolidayPage(filePath) {
  console.log(`Updating ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Extract holiday name from path
    const holidayMatch = filePath.match(/src\/app\/([^\/]+)\/page\.tsx/);
    if (!holidayMatch) {
      console.log(`  Skipping ${filePath} - not a holiday page`);
      return;
    }

    const holiday = holidayMatch[1];
    console.log(`  Holiday: ${holiday}`);

    // Add imports if not already present
    if (!content.includes('shouldSkipHolidayQuery')) {
      const importIndex = content.lastIndexOf('import');
      const nextLineIndex = content.indexOf('\n', importIndex) + 1;
      content =
        content.slice(0, nextLineIndex) +
        IMPORT_ADDITION +
        '\n' +
        content.slice(nextLineIndex);
    }

    // Replace hooks section
    const hooksPattern =
      /const holidayPreferences = useAppSelector\([\s\S]*?const holidayId = getHolidayIdFromRoute\([^)]+\);/;
    if (hooksPattern.test(content)) {
      const replacement = HOOKS_REPLACEMENT.replace(/{HOLIDAY}/g, holiday);
      content = content.replace(hooksPattern, replacement);
    }

    // Replace skip patterns
    content = content.replace(SKIP_PATTERN, SKIP_REPLACEMENT);

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Updating holiday pages with Redux-first pattern...\n');

  HOLIDAY_PAGES.forEach(updateHolidayPage);

  console.log('\n✨ Holiday page updates complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Test navigation between pages');
  console.log('3. Verify no duplicate network calls');
}

if (require.main === module) {
  main();
}

module.exports = { updateHolidayPage };
