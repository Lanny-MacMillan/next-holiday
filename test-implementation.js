// Test implementation for the improvements
const { toPlain } = require('./src/lib/json.ts');
const { dateOnlyToUTC, toDateOnlyString } = require('./src/lib/dates.ts');

// Test 1: Decimal serialization
console.log('=== Testing Decimal Serialization ===');
const mockBudget = {
  id: '1',
  name: 'Christmas Budget',
  totalBudget: { constructor: { name: 'Decimal' }, toString: () => '199.99' },
  spentAmount: { constructor: { name: 'Decimal' }, toString: () => '50.00' },
  remainingAmount: {
    constructor: { name: 'Decimal' },
    toString: () => '149.99',
  },
};

const serialized = toPlain(mockBudget);
console.log('Original:', mockBudget);
console.log('Serialized:', serialized);

// Test 2: Date handling
console.log('\n=== Testing Date Handling ===');
const dateString = '2025-12-01';
const utcDate = dateOnlyToUTC(dateString);
const backToString = toDateOnlyString(utcDate);

console.log('Input date string:', dateString);
console.log('UTC date:', utcDate);
console.log('Back to string:', backToString);

// Test 3: Date-only vs DateTime
console.log('\n=== Testing Date vs DateTime ===');
const dateOnly = dateOnlyToUTC('2025-12-01');
const dateTime = new Date('2025-12-01T15:30:45.123Z');

console.log('Date only (UTC midnight):', dateOnly);
console.log('DateTime (with time):', dateTime);
console.log('Date only string:', toDateOnlyString(dateOnly));
console.log('DateTime string:', toDateOnlyString(dateTime));

console.log('\n✅ All tests completed!');
