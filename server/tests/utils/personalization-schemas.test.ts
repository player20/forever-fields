/**
 * Forever Fields - Personalization Validation Schema Tests
 * Tests for religion, gender, pronouns, and resting location validation
 *
 * Run with: npx tsx tests/utils/personalization-schemas.test.ts
 */

import {
  createMemorialSchema,
  updateMemorialSchema,
  createPhotoSchema,
  updatePhotoSchema,
  createRecipeSchema,
  updateRecipeSchema,
  createLifeEventSchema,
  updateLifeEventSchema,
} from '../../src/validators/schemas';

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

console.log('\n🧪 Running Personalization Schema Validation Tests...\n');

// ============================================
// RELIGION VALIDATION TESTS
// ============================================

console.log('✝️ Religion Field Validation:');

// Test 1: Valid religion - Christian
const religion1 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  religion: 'Christian',
});
assert(religion1.success, 'Christian is valid religion');

// Test 2: Valid religion - Muslim
const religion2 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  religion: 'Muslim',
});
assert(religion2.success, 'Muslim is valid religion');

// Test 3: Valid religion - Prefer not to say
const religion3 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  religion: 'Prefer not to say',
});
assert(religion3.success, '"Prefer not to say" is valid religion');

// Test 4: Invalid religion
const religion4 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  religion: 'InvalidReligion',
});
assert(!religion4.success, 'Invalid religion rejected');

// Test 5: Null religion is allowed
const religion5 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  religion: null,
});
assert(religion5.success, 'Null religion is allowed');

// Test 6: Religion field is optional
const religion6 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
});
assert(religion6.success, 'Religion field is optional');

// ============================================
// GENDER VALIDATION TESTS
// ============================================

console.log('\n👤 Gender Field Validation:');

// Test 7: Valid gender - Male
const gender1 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  gender: 'Male',
});
assert(gender1.success, 'Male is valid gender');

// Test 8: Valid gender - Female
const gender2 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  gender: 'Female',
});
assert(gender2.success, 'Female is valid gender');

// Test 9: Valid gender - Non-Binary
const gender3 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  gender: 'Non-Binary',
});
assert(gender3.success, 'Non-Binary is valid gender');

// Test 10: Valid gender - Other
const gender4 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  gender: 'Other',
});
assert(gender4.success, 'Other is valid gender');

// Test 11: Invalid gender
const gender5 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  gender: 'InvalidGender',
});
assert(!gender5.success, 'Invalid gender rejected');

// ============================================
// CUSTOM PRONOUNS VALIDATION TESTS
// ============================================

console.log('\n💬 Custom Pronouns Validation:');

// Test 12: Valid custom pronouns
const pronouns1 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  customPronouns: 'they/them',
});
assert(pronouns1.success, 'Valid custom pronouns accepted');

// Test 13: Custom pronouns - xe/xem
const pronouns2 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  customPronouns: 'xe/xem',
});
assert(pronouns2.success, 'Neopronouns xe/xem accepted');

// Test 14: Custom pronouns too long (>100 chars)
const longPronouns = 'a'.repeat(101);
const pronouns3 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  customPronouns: longPronouns,
});
assert(!pronouns3.success, 'Pronouns > 100 chars rejected');

// Test 15: Custom pronouns exactly 100 chars
const exactPronouns = 'a'.repeat(100);
const pronouns4 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  customPronouns: exactPronouns,
});
assert(pronouns4.success, 'Pronouns exactly 100 chars accepted');

// Test 16: Null custom pronouns
const pronouns5 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  customPronouns: null,
});
assert(pronouns5.success, 'Null custom pronouns allowed');

// ============================================
// RESTING TYPE VALIDATION TESTS
// ============================================

console.log('\n🏛️ Resting Type Validation:');

// Test 17: Valid resting type - buried
const resting1 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingType: 'buried',
});
assert(resting1.success, 'buried is valid resting type');

// Test 18: Valid resting type - cremated_home
const resting2 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingType: 'cremated_home',
});
assert(resting2.success, 'cremated_home is valid resting type');

// Test 19: Valid resting type - cremated_scattered
const resting3 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingType: 'cremated_scattered',
});
assert(resting3.success, 'cremated_scattered is valid resting type');

// Test 20: Valid resting type - prefer_not_to_say
const resting4 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingType: 'prefer_not_to_say',
});
assert(resting4.success, 'prefer_not_to_say is valid resting type');

// Test 21: Invalid resting type
const resting5 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingType: 'invalid_type',
});
assert(!resting5.success, 'Invalid resting type rejected');

// ============================================
// RESTING LOCATION VALIDATION TESTS
// ============================================

console.log('\n📍 Resting Location Validation:');

// Test 22: Valid location with coordinates
const location1 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: 34.0522,
    lng: -118.2437,
    name: 'Forest Lawn',
    address: '1234 Memorial Dr',
  },
});
assert(location1.success, 'Valid location with coordinates');

// Test 23: Location with only name
const location2 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: 'Forest Lawn Cemetery',
  },
});
assert(location2.success, 'Location with only name');

// Test 24: Location with only address
const location3 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    address: '1234 Memorial Dr, City, ST',
  },
});
assert(location3.success, 'Location with only address');

// Test 25: Invalid latitude (> 90)
const location4 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: 91,
    lng: 0,
  },
});
assert(!location4.success, 'Latitude > 90 rejected');

// Test 26: Invalid latitude (< -90)
const location5 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: -91,
    lng: 0,
  },
});
assert(!location5.success, 'Latitude < -90 rejected');

// Test 27: Invalid longitude (> 180)
const location6 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: 0,
    lng: 181,
  },
});
assert(!location6.success, 'Longitude > 180 rejected');

// Test 28: Invalid longitude (< -180)
const location7 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: 0,
    lng: -181,
  },
});
assert(!location7.success, 'Longitude < -180 rejected');

// Test 29: Valid edge case coordinates
const location8 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    lat: 90,
    lng: 180,
  },
});
assert(location8.success, 'Edge coordinates (90, 180) accepted');

// Test 30: Location name too long (>200 chars)
const longName = 'a'.repeat(201);
const location9 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: longName,
  },
});
assert(!location9.success, 'Location name > 200 chars rejected');

// Test 31: Location address too long (>500 chars)
const longAddress = 'a'.repeat(501);
const location10 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    address: longAddress,
  },
});
assert(!location10.success, 'Location address > 500 chars rejected');

// Test 32: Location with photo URL
const location11 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: 'Ocean View',
    photoUrl: 'https://example.com/photo.jpg',
  },
});
assert(location11.success, 'Location with valid photo URL');

// Test 33: Location with invalid photo URL
const location12 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: 'Ocean View',
    photoUrl: 'not-a-url',
  },
});
assert(!location12.success, 'Location with invalid photo URL rejected');

// Test 34: Location with description
const location13 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: 'Pacific Ocean',
    description: 'Where they loved to surf',
  },
});
assert(location13.success, 'Location with description accepted');

// Test 35: Location description too long (>1000 chars)
const longDescription = 'a'.repeat(1001);
const location14 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: {
    name: 'Ocean',
    description: longDescription,
  },
});
assert(!location14.success, 'Location description > 1000 chars rejected');

// Test 36: Null resting location
const location15 = createMemorialSchema.safeParse({
  deceasedName: 'Test Person',
  birthDate: '2000-01-01T00:00:00Z',
  restingLocation: null,
});
assert(location15.success, 'Null resting location allowed');

// ============================================
// PHOTO SCHEMA VALIDATION TESTS
// ============================================

console.log('\n📸 Photo Schema Validation:');

// Test 37: Valid photo creation
const photo1 = createPhotoSchema.safeParse({
  url: 'https://example.com/photo.jpg',
  caption: 'Beautiful memory',
  uploadedBy: 'John Doe',
});
assert(photo1.success, 'Valid photo accepted');

// Test 38: Photo with invalid URL
const photo2 = createPhotoSchema.safeParse({
  url: 'not-a-url',
  caption: 'Test',
});
assert(!photo2.success, 'Invalid photo URL rejected');

// Test 39: Photo caption too long
const longCaption = 'a'.repeat(501);
const photo3 = createPhotoSchema.safeParse({
  url: 'https://example.com/photo.jpg',
  caption: longCaption,
});
assert(!photo3.success, 'Photo caption > 500 chars rejected');

// Test 40: Update photo with valid caption
const photo4 = updatePhotoSchema.safeParse({
  caption: 'Updated caption',
});
assert(photo4.success, 'Valid photo update accepted');

// ============================================
// RECIPE SCHEMA VALIDATION TESTS
// ============================================

console.log('\n🍳 Recipe Schema Validation:');

// Test 41: Valid recipe creation
const recipe1 = createRecipeSchema.safeParse({
  name: 'Grandma\'s Apple Pie',
  description: 'Her famous recipe',
  icon: '🥧',
  ingredients: 'Apples, sugar, flour',
  instructions: 'Mix and bake',
});
assert(recipe1.success, 'Valid recipe accepted');

// Test 42: Recipe name too long
const longRecipeName = 'a'.repeat(201);
const recipe2 = createRecipeSchema.safeParse({
  name: longRecipeName,
});
assert(!recipe2.success, 'Recipe name > 200 chars rejected');

// Test 43: Recipe without name
const recipe3 = createRecipeSchema.safeParse({
  description: 'Test',
});
assert(!recipe3.success, 'Recipe without name rejected');

// Test 44: Recipe ingredients too long
const longIngredients = 'a'.repeat(2001);
const recipe4 = createRecipeSchema.safeParse({
  name: 'Test Recipe',
  ingredients: longIngredients,
});
assert(!recipe4.success, 'Recipe ingredients > 2000 chars rejected');

// Test 45: Recipe instructions too long
const longInstructions = 'a'.repeat(5001);
const recipe5 = createRecipeSchema.safeParse({
  name: 'Test Recipe',
  instructions: longInstructions,
});
assert(!recipe5.success, 'Recipe instructions > 5000 chars rejected');

// ============================================
// LIFE EVENT SCHEMA VALIDATION TESTS
// ============================================

console.log('\n📅 Life Event Schema Validation:');

// Test 46: Valid life event with single year
const event1 = createLifeEventSchema.safeParse({
  year: '1990',
  title: 'Born',
  description: 'Birth year',
});
assert(event1.success, 'Valid life event with single year');

// Test 47: Valid life event with year range
const event2 = createLifeEventSchema.safeParse({
  year: '1990-2000',
  title: 'Childhood',
  description: 'Growing up',
});
assert(event2.success, 'Valid life event with year range');

// Test 48: Invalid year format (3 digits)
const event3 = createLifeEventSchema.safeParse({
  year: '199',
  title: 'Test',
  description: 'Test',
});
assert(!event3.success, 'Invalid year format (3 digits) rejected');

// Test 49: Invalid year format (letters)
const event4 = createLifeEventSchema.safeParse({
  year: 'ABCD',
  title: 'Test',
  description: 'Test',
});
assert(!event4.success, 'Invalid year format (letters) rejected');

// Test 50: Life event title too long
const longTitle = 'a'.repeat(201);
const event5 = createLifeEventSchema.safeParse({
  year: '1990',
  title: longTitle,
  description: 'Test',
});
assert(!event5.success, 'Life event title > 200 chars rejected');

// Test 51: Life event description too long
const longEventDesc = 'a'.repeat(1001);
const event6 = createLifeEventSchema.safeParse({
  year: '1990',
  title: 'Test',
  description: longEventDesc,
});
assert(!event6.success, 'Life event description > 1000 chars rejected');

// Test 52: Life event without required fields
const event7 = createLifeEventSchema.safeParse({
  year: '1990',
});
assert(!event7.success, 'Life event without title/description rejected');

// ============================================
// UPDATE SCHEMA TESTS
// ============================================

console.log('\n🔄 Update Schema Validation:');

// Test 53: Update memorial with new personalization fields
const update1 = updateMemorialSchema.safeParse({
  religion: 'Buddhist',
  gender: 'Non-Binary',
  customPronouns: 'they/them',
  restingType: 'cremated_scattered',
});
assert(update1.success, 'Valid memorial update with personalization');

// Test 54: Partial update (only religion)
const update2 = updateMemorialSchema.safeParse({
  religion: 'Christian',
});
assert(update2.success, 'Partial update (religion only)');

// Test 55: Update recipe with partial fields
const update3 = updateRecipeSchema.safeParse({
  name: 'Updated Name',
});
assert(update3.success, 'Partial recipe update');

// Test 56: Update life event with partial fields
const update4 = updateLifeEventSchema.safeParse({
  title: 'Updated Title',
});
assert(update4.success, 'Partial life event update');

// ============================================
// INTEGRATION TESTS
// ============================================

console.log('\n🔗 Integration Tests:');

// Test 57: Complete memorial with all personalization fields
const complete1 = createMemorialSchema.safeParse({
  deceasedName: 'John Doe',
  birthDate: '1935-06-15T00:00:00Z',
  deathDate: '2023-11-20T00:00:00Z',
  portraitUrl: 'https://example.com/portrait.jpg',
  shortBio: 'A wonderful person',
  isPet: false,
  privacy: 'public',
  religion: 'Christian',
  gender: 'Male',
  restingType: 'buried',
  restingLocation: {
    lat: 34.0522,
    lng: -118.2437,
    name: 'Forest Lawn Cemetery',
    address: '1234 Memorial Dr, Los Angeles, CA',
    description: 'A peaceful resting place',
  },
});
assert(complete1.success, 'Complete memorial with all fields');

// Test 58: Pet memorial with personalization
const complete2 = createMemorialSchema.safeParse({
  deceasedName: 'Max',
  birthDate: '2010-03-20T00:00:00Z',
  deathDate: '2023-12-25T00:00:00Z',
  isPet: true,
  restingType: 'cremated_home',
});
assert(complete2.success, 'Pet memorial accepted');

// Test 59: Minimal valid memorial (name + birth date)
const complete3 = createMemorialSchema.safeParse({
  deceasedName: 'Jane Doe',
  birthDate: '1950-01-01T00:00:00Z',
});
assert(complete3.success, 'Minimal memorial with birth date');

// Test 60: Minimal valid memorial (name + death date)
const complete4 = createMemorialSchema.safeParse({
  deceasedName: 'Jane Doe',
  deathDate: '2023-01-01T00:00:00Z',
});
assert(complete4.success, 'Minimal memorial with death date');

// ============================================
// TEST SUMMARY
// ============================================

console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
