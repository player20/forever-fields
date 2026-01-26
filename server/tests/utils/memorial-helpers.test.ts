/**
 * Forever Fields - Memorial Helpers Unit Tests
 * Tests for age calculation, formatting, and location helpers
 *
 * Run with: npx tsx tests/utils/memorial-helpers.test.ts
 */

import {
  calculateAge,
  formatAge,
  getPronounsDisplay,
  formatRestingLocation,
  validateRestingLocationData,
  yearsSinceDeath,
  formatYearsSinceDeath,
} from '../../src/utils/memorial-helpers';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

// Assertion helper
function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

function assertEqual(actual: any, expected: any, testName: string) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  assert(passed, testName);
  if (!passed) {
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
  }
}

console.log('\n🧪 Running Memorial Helpers Tests...\n');

// ============================================
// AGE CALCULATION TESTS
// ============================================

console.log('📊 Age Calculation Tests:');

// Test 1: Basic age calculation
const age1 = calculateAge('1935-06-15', '2023-11-20');
assertEqual(age1, 88, 'Calculate age: 1935 to 2023 = 88 years');

// Test 2: Age calculation with same month/day (birthday occurred)
const age2 = calculateAge('1990-01-01', '2025-01-01');
assertEqual(age2, 35, 'Calculate age: birthday already occurred this year');

// Test 3: Age calculation with birthday not yet occurred
const age3 = calculateAge('1990-06-15', '2025-01-01');
assertEqual(age3, 34, 'Calculate age: birthday not yet occurred this year');

// Test 4: Less than 1 year old
const age4 = calculateAge('2023-06-01', '2023-11-01');
assertEqual(age4, 0, 'Calculate age: less than 1 year');

// Test 5: Exactly 1 year old
const age5 = calculateAge('2022-01-01', '2023-01-01');
assertEqual(age5, 1, 'Calculate age: exactly 1 year');

// Test 6: Leap year handling (Feb 29)
const age6 = calculateAge('2000-02-29', '2024-02-29');
assertEqual(age6, 24, 'Calculate age: leap year born, leap year death');

// Test 7: Invalid dates (death before birth)
const age7 = calculateAge('2023-01-01', '2020-01-01');
assertEqual(age7, null, 'Invalid: death before birth returns null');

// Test 8: Null inputs
const age8 = calculateAge(null, '2023-01-01');
assertEqual(age8, null, 'Null birth date returns null');

const age9 = calculateAge('2020-01-01', null);
assertEqual(age9, null, 'Null death date returns null');

// Test 9: Invalid date strings
const age10 = calculateAge('invalid', '2023-01-01');
assertEqual(age10, null, 'Invalid birth date string returns null');

// Test 10: Date objects
const age11 = calculateAge(new Date('1980-05-20'), new Date('2023-05-20'));
assertEqual(age11, 43, 'Calculate age with Date objects');

// ============================================
// AGE FORMATTING TESTS
// ============================================

console.log('\n📝 Age Formatting Tests:');

// Test 11: Format age for adult human
const formatted1 = formatAge(88, false);
assertEqual(formatted1, 'Lived 88 years', 'Format 88 years for human');

// Test 12: Format age for pet
const formatted2 = formatAge(12, true);
assertEqual(formatted2, '12 years young', 'Format 12 years for pet');

// Test 13: Format 0 years for human
const formatted3 = formatAge(0, false);
assertEqual(formatted3, 'Less than a year old', 'Format 0 years for human');

// Test 14: Format 0 years for pet
const formatted4 = formatAge(0, true);
assertEqual(formatted4, 'Less than a year', 'Format 0 years for pet');

// Test 15: Format 1 year for human
const formatted5 = formatAge(1, false);
assertEqual(formatted5, 'Lived 1 year', 'Format 1 year for human');

// Test 16: Format 1 year for pet
const formatted6 = formatAge(1, true);
assertEqual(formatted6, '1 year young', 'Format 1 year for pet');

// Test 17: Null age
const formatted7 = formatAge(null, false);
assertEqual(formatted7, null, 'Null age returns null');

// Test 18: Undefined age
const formatted8 = formatAge(undefined, false);
assertEqual(formatted8, null, 'Undefined age returns null');

// ============================================
// PRONOUNS DISPLAY TESTS
// ============================================

console.log('\n👤 Pronouns Display Tests:');

// Test 19: Male gender auto-derives pronouns
const pronouns1 = getPronounsDisplay('Male', null);
assertEqual(pronouns1, 'he/him', 'Male gender derives he/him');

// Test 20: Female gender auto-derives pronouns
const pronouns2 = getPronounsDisplay('Female', null);
assertEqual(pronouns2, 'she/her', 'Female gender derives she/her');

// Test 21: Non-Binary gender auto-derives pronouns
const pronouns3 = getPronounsDisplay('Non-Binary', null);
assertEqual(pronouns3, 'they/them', 'Non-Binary gender derives they/them');

// Test 22: Custom pronouns override gender
const pronouns4 = getPronounsDisplay('Male', 'they/them');
assertEqual(pronouns4, 'they/them', 'Custom pronouns override gender');

// Test 23: Other gender with custom pronouns
const pronouns5 = getPronounsDisplay('Other', 'xe/xem');
assertEqual(pronouns5, 'xe/xem', 'Other gender uses custom pronouns');

// Test 24: Prefer not to say returns null
const pronouns6 = getPronounsDisplay('Prefer not to say', null);
assertEqual(pronouns6, null, 'Prefer not to say returns null');

// Test 25: Other gender without custom pronouns returns null
const pronouns7 = getPronounsDisplay('Other', null);
assertEqual(pronouns7, null, 'Other gender without custom returns null');

// Test 26: Null gender returns null
const pronouns8 = getPronounsDisplay(null, null);
assertEqual(pronouns8, null, 'Null gender returns null');

// Test 27: Whitespace custom pronouns are ignored
const pronouns9 = getPronounsDisplay('Male', '   ');
assertEqual(pronouns9, 'he/him', 'Whitespace custom pronouns ignored');

// ============================================
// RESTING LOCATION FORMATTING TESTS
// ============================================

console.log('\n🌹 Resting Location Formatting Tests:');

// Test 28: Buried with name
const location1 = formatRestingLocation('buried', { name: 'Forest Lawn Cemetery' });
assertEqual(location1, 'Buried at Forest Lawn Cemetery', 'Buried with cemetery name');

// Test 29: Buried with address only
const location2 = formatRestingLocation('buried', { address: '1234 Memorial Dr, City, ST' });
assertEqual(location2, 'Buried at 1234 Memorial Dr, City, ST', 'Buried with address only');

// Test 30: Buried with no location data
const location3 = formatRestingLocation('buried', null);
assertEqual(location3, 'Buried at cemetery', 'Buried with no location data');

// Test 31: Cremated at home
const location4 = formatRestingLocation('cremated_home', null);
assertEqual(location4, 'Cremated, remains kept at home', 'Cremated at home');

// Test 32: Ashes scattered with name
const location5 = formatRestingLocation('cremated_scattered', { name: 'Pacific Ocean' });
assertEqual(location5, 'Ashes scattered at Pacific Ocean', 'Ashes scattered with name');

// Test 33: Ashes scattered with address
const location6 = formatRestingLocation('cremated_scattered', { address: 'Malibu Beach, CA' });
assertEqual(location6, 'Ashes scattered at Malibu Beach, CA', 'Ashes scattered with address');

// Test 34: Ashes scattered with no location
const location7 = formatRestingLocation('cremated_scattered', null);
assertEqual(location7, 'Ashes scattered', 'Ashes scattered with no location');

// Test 35: Prefer not to say
const location8 = formatRestingLocation('prefer_not_to_say', null);
assertEqual(location8, null, 'Prefer not to say returns null');

// Test 36: Null resting type
const location9 = formatRestingLocation(null, { name: 'Test' });
assertEqual(location9, null, 'Null resting type returns null');

// ============================================
// RESTING LOCATION VALIDATION TESTS
// ============================================

console.log('\n✅ Resting Location Validation Tests:');

// Test 37: Valid buried location with name
const valid1 = validateRestingLocationData('buried', { name: 'Forest Lawn' });
assertEqual(valid1, { valid: true }, 'Buried with name is valid');

// Test 38: Valid buried location with address
const valid2 = validateRestingLocationData('buried', { address: '123 Main St' });
assertEqual(valid2, { valid: true }, 'Buried with address is valid');

// Test 39: Invalid buried location (no data)
const valid3 = validateRestingLocationData('buried', null);
assert(!valid3.valid && valid3.message?.includes('location'), 'Buried without location is invalid');

// Test 40: Invalid buried location (empty object)
const valid4 = validateRestingLocationData('buried', {});
assert(!valid4.valid && valid4.message?.includes('location'), 'Buried with empty object is invalid');

// Test 41: Valid cremated_home (no location needed)
const valid5 = validateRestingLocationData('cremated_home', null);
assertEqual(valid5, { valid: true }, 'Cremated at home with no location is valid');

// Test 42: Valid scattered with name
const valid6 = validateRestingLocationData('cremated_scattered', { name: 'Ocean' });
assertEqual(valid6, { valid: true }, 'Scattered with name is valid');

// Test 43: Invalid scattered (no data)
const valid7 = validateRestingLocationData('cremated_scattered', null);
assert(!valid7.valid && valid7.message?.includes('location'), 'Scattered without location is invalid');

// Test 44: Valid prefer not to say
const valid8 = validateRestingLocationData('prefer_not_to_say', null);
assertEqual(valid8, { valid: true }, 'Prefer not to say is valid without location');

// Test 45: Valid null resting type
const valid9 = validateRestingLocationData(null, null);
assertEqual(valid9, { valid: true }, 'Null resting type is valid');

// ============================================
// YEARS SINCE DEATH TESTS
// ============================================

console.log('\n📅 Years Since Death Tests:');

// Test 46: Years since death (current year)
const now = new Date();
const thisYear = now.getFullYear();
const lastYear = new Date(`${thisYear - 1}-01-01`);
const yearsSince1 = yearsSinceDeath(lastYear);
assertEqual(yearsSince1, 1, 'Death 1 year ago');

// Test 47: Death this year (before today)
const thisYearDeath = new Date(thisYear, 0, 1); // Jan 1 this year
const yearsSince2 = yearsSinceDeath(thisYearDeath);
assertEqual(yearsSince2, 0, 'Death this year returns 0');

// Test 48: Null death date
const yearsSince3 = yearsSinceDeath(null);
assertEqual(yearsSince3, null, 'Null death date returns null');

// Test 49: Invalid death date
const yearsSince4 = yearsSinceDeath('invalid');
assertEqual(yearsSince4, null, 'Invalid death date returns null');

// Test 50: Future death date
const futureDeath = new Date(thisYear + 1, 0, 1);
const yearsSince5 = yearsSinceDeath(futureDeath);
assert(yearsSince5 === null || yearsSince5 < 0, 'Future death date handled');

// ============================================
// FORMAT YEARS SINCE DEATH TESTS
// ============================================

console.log('\n📆 Format Years Since Death Tests:');

// Test 51: Format 0 years
const formattedYears1 = formatYearsSinceDeath(0);
assertEqual(formattedYears1, 'This year', 'Format 0 years as "This year"');

// Test 52: Format 1 year
const formattedYears2 = formatYearsSinceDeath(1);
assertEqual(formattedYears2, '1 year ago', 'Format 1 year');

// Test 53: Format multiple years
const formattedYears3 = formatYearsSinceDeath(10);
assertEqual(formattedYears3, '10 years ago', 'Format 10 years');

// Test 54: Format null
const formattedYears4 = formatYearsSinceDeath(null);
assertEqual(formattedYears4, null, 'Null years returns null');

// Test 55: Format undefined
const formattedYears5 = formatYearsSinceDeath(undefined);
assertEqual(formattedYears5, null, 'Undefined years returns null');

// ============================================
// EDGE CASES AND ERROR HANDLING
// ============================================

console.log('\n🔧 Edge Cases and Error Handling:');

// Test 56: Very old age
const veryOldAge = calculateAge('1850-01-01', '2023-01-01');
assertEqual(veryOldAge, 173, 'Handle very old age (173 years)');

// Test 57: Age on same day
const sameDayAge = calculateAge('2000-05-15', '2025-05-15');
assertEqual(sameDayAge, 25, 'Age calculated on exact birthday');

// Test 58: Pronouns with leading/trailing spaces
const pronounsSpaces = getPronounsDisplay('Other', '  ze/zir  ');
assertEqual(pronounsSpaces, 'ze/zir', 'Pronouns trimmed correctly');

// Test 59: Location with both name and address (name preferred)
const locationBoth = formatRestingLocation('buried', {
  name: 'Forest Lawn',
  address: '123 Main St',
});
assertEqual(locationBoth, 'Buried at Forest Lawn', 'Name preferred over address');

// Test 60: Empty string parameters
const emptyAge = calculateAge('', '2023-01-01');
assertEqual(emptyAge, null, 'Empty string date returns null');

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
