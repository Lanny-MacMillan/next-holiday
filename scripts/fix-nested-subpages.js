#!/usr/bin/env node

/**
 * Script to fix nested subpages to use Redux-first pattern
 * Updates gift-list, cards, tasks, events, decorations, candle-lighting, resolution-tracker pages
 */

const fs = require('fs');
const path = require('path');

const nestedSubpages = [
  'gift-list',
  'cards',
  'tasks',
  'events',
  'decorations',
  'candle-lighting',
  'resolution-tracker',
];

const holidayRoutes = [
  'christmas',
  'hanukkah',
  'kwanzaa',
  'new-year',
  'valentines',
  'easter',
  'halloween',
  'thanksgiving',
  'mothers-day',
  'fathers-day',
  'fourth-of-july',
  'birthday',
  'anniversary',
  'graduation',
  'baby-shower',
];

function updateNestedSubpage(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add imports if not present
  if (
    content.includes('useGetGiftsQuery') ||
    content.includes('useGetCardsQuery') ||
    content.includes('useGetTasksQuery')
  ) {
    // Add shouldSkipHolidayQueryWithColdEntry import
    if (!content.includes('shouldSkipHolidayQueryWithColdEntry')) {
      if (content.includes('from "@/utils/holidayData"')) {
        content = content.replace(
          /import { [^}]+ } from "@\/utils\/holidayData";/,
          'import { shouldSkipHolidayQueryWithColdEntry } from "@/utils/holidayData";',
        );
      } else {
        // Add import after other imports
        const importMatch = content.match(/import.*from.*["'].*["'];\s*\n/);
        if (importMatch) {
          const insertIndex = importMatch.index + importMatch[0].length;
          content =
            content.slice(0, insertIndex) +
            'import { shouldSkipHolidayQueryWithColdEntry } from "@/utils/holidayData";\n' +
            content.slice(insertIndex);
        }
      }
      modified = true;
    }

    // Add selectors import if not present
    if (
      !content.includes('selectHomeInitialized') &&
      !content.includes('selectHolidayPreferences')
    ) {
      if (content.includes('from "@/store/selectors/home"')) {
        // Already has home selectors import
      } else {
        const importMatch = content.match(/import.*from.*["'].*["'];\s*\n/);
        if (importMatch) {
          const insertIndex = importMatch.index + importMatch[0].length;
          content =
            content.slice(0, insertIndex) +
            'import { selectHolidayPreferences, selectHomeInitialized, selectHomeData } from "@/store/selectors/home";\n' +
            content.slice(insertIndex);
        }
        modified = true;
      }
    }
  }

  // Add Redux selectors and state logic
  if (
    content.includes('useGetGiftsQuery') ||
    content.includes('useGetCardsQuery') ||
    content.includes('useGetTasksQuery')
  ) {
    // Add selectors after useAuth0
    if (
      content.includes('useAuth0()') &&
      !content.includes('selectHolidayPreferences')
    ) {
      content = content.replace(
        /const { user: auth0User } = useAuth0\(\);/,
        `const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);
	const currentState = useAppSelector((state: any) => state);`,
      );
      modified = true;
    }
  }

  // Replace skip conditions
  const skipPatterns = [
    /{ skip: !holidayId \|\| !auth0User }/g,
    /{ skip: !.*holidayId.*\|\|.*!.*auth0User.*}/g,
  ];

  skipPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(
        pattern,
        '{ skip: shouldSkipHolidayQueryWithColdEntry(holidayId, auth0User, currentState, true) }',
      );
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

function main() {
  console.log('Fixing nested subpages to use Redux-first pattern...\n');

  holidayRoutes.forEach(holiday => {
    nestedSubpages.forEach(subpage => {
      const pagePath = path.join(
        __dirname,
        '..',
        'src',
        'app',
        holiday,
        subpage,
        'page.tsx',
      );
      updateNestedSubpage(pagePath);
    });
  });

  console.log('\nNested subpages fixes completed!');
}

if (require.main === module) {
  main();
}

module.exports = { updateNestedSubpage };
