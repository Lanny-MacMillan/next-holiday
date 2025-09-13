#!/usr/bin/env node

/**
 * Verification script for the Redux-first refactor
 * Run with: node scripts/verify-refactor.js
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Redux-first refactor...\n");

// Check 1: Verify all holiday pages have the new pattern
const HOLIDAY_PAGES = [
	"src/app/christmas/page.tsx",
	"src/app/hanukkah/page.tsx",
	"src/app/kwanzaa/page.tsx",
	"src/app/new-year/page.tsx",
	"src/app/valentines/page.tsx",
	"src/app/easter/page.tsx",
	"src/app/halloween/page.tsx",
	"src/app/thanksgiving/page.tsx",
	"src/app/mothers-day/page.tsx",
	"src/app/fathers-day/page.tsx",
	"src/app/fourth-of-july/page.tsx",
	"src/app/birthday/page.tsx",
	"src/app/anniversary/page.tsx",
	"src/app/graduation/page.tsx",
	"src/app/baby-shower/page.tsx",
];

let allPagesUpdated = true;
let pagesWithOldPattern = [];

HOLIDAY_PAGES.forEach((filePath) => {
	try {
		const content = fs.readFileSync(filePath, "utf8");

		// Check for new pattern
		const hasNewPattern =
			content.includes("shouldSkipHolidayQuery") &&
			content.includes("selectHolidayPreferences");

		// Check for old pattern
		const hasOldPattern = content.includes(
			"{ skip: !holidayId || !auth0User }"
		);

		if (!hasNewPattern || hasOldPattern) {
			allPagesUpdated = false;
			pagesWithOldPattern.push(filePath);
			console.log(`❌ ${filePath} - Not fully updated`);
		} else {
			console.log(`✅ ${filePath} - Updated correctly`);
		}
	} catch (error) {
		console.log(`❌ ${filePath} - Error reading file: ${error.message}`);
		allPagesUpdated = false;
	}
});

console.log("\n📊 Holiday Pages Update Status:");
console.log(`   Total pages: ${HOLIDAY_PAGES.length}`);
console.log(`   Updated: ${HOLIDAY_PAGES.length - pagesWithOldPattern.length}`);
console.log(`   Needs update: ${pagesWithOldPattern.length}`);

// Check 2: Verify utility files exist
const UTILITY_FILES = [
	"src/utils/holidayData.ts",
	"src/store/selectors/home.ts",
];

console.log("\n🔧 Utility Files:");
UTILITY_FILES.forEach((filePath) => {
	if (fs.existsSync(filePath)) {
		console.log(`✅ ${filePath} - Exists`);
	} else {
		console.log(`❌ ${filePath} - Missing`);
		allPagesUpdated = false;
	}
});

// Check 3: Verify ESLint config has new rules
try {
	const eslintConfig = fs.readFileSync("eslint.config.mjs", "utf8");
	if (
		eslintConfig.includes("no-restricted-syntax") &&
		eslintConfig.includes("fetch")
	) {
		console.log("✅ ESLint config - Anti-pattern rules added");
	} else {
		console.log("❌ ESLint config - Anti-pattern rules missing");
		allPagesUpdated = false;
	}
} catch (error) {
	console.log("❌ ESLint config - Error reading file");
	allPagesUpdated = false;
}

// Check 4: Verify package.json has guard scripts
try {
	const packageJson = fs.readFileSync("package.json", "utf8");
	if (
		packageJson.includes("guard:fetch") &&
		packageJson.includes("guard:storage")
	) {
		console.log("✅ Package.json - Guard scripts added");
	} else {
		console.log("❌ Package.json - Guard scripts missing");
		allPagesUpdated = false;
	}
} catch (error) {
	console.log("❌ Package.json - Error reading file");
	allPagesUpdated = false;
}

// Check 5: Verify test files exist
const TEST_FILES = [
	"src/utils/__tests__/holidayData.test.ts",
	"src/__tests__/routes/holiday-pages.no-dup-fetch.test.tsx",
];

console.log("\n🧪 Test Files:");
TEST_FILES.forEach((filePath) => {
	if (fs.existsSync(filePath)) {
		console.log(`✅ ${filePath} - Exists`);
	} else {
		console.log(`❌ ${filePath} - Missing`);
		allPagesUpdated = false;
	}
});

// Final summary
console.log("\n🎯 REFACTOR VERIFICATION SUMMARY:");
if (allPagesUpdated) {
	console.log("✅ SUCCESS: All refactor tasks completed successfully!");
	console.log("\n🚀 Next steps:");
	console.log("1. Test navigation between pages in browser");
	console.log("2. Verify no duplicate network calls in DevTools");
	console.log("3. Check budget consistency across pages");
	console.log("4. Run tests: npm test");
	console.log("5. Run guards: npm run guard:all");
} else {
	console.log("❌ ISSUES FOUND: Some refactor tasks need attention");
	if (pagesWithOldPattern.length > 0) {
		console.log("\n📝 Pages that need updating:");
		pagesWithOldPattern.forEach((page) => console.log(`   - ${page}`));
	}
}

console.log("\n✨ Verification complete!");

