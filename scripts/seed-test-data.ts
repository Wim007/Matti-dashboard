import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { analyticsEvents } from '../drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

// Realistic data distributions
const AGE_GROUPS = ['12-14', '15-17', '18-21'];
const USER_TYPES = ['jongere']; // Matti is only for youth
const FAMILY_TYPES = ['eenouder', 'tweeouder', 'samengesteld'];
const APPS = ['matti']; // Dashboard is now Matti-only

// Dutch postal code areas (first 4 digits)
const POSTAL_CODES = [
  '1000', '1010', '1020', '1050', '1060', '1070', '1080', '1090', // Amsterdam
  '3000', '3010', '3020', '3050', '3070', // Rotterdam
  '2500', '2510', '2520', '2540', '2550', // Den Haag
  '3500', '3510', '3520', '3550', '3570', // Utrecht
  '5600', '5610', '5620', '5650', // Eindhoven
  '6500', '6510', '6520', '6550', // Nijmegen
  '9700', '9710', '9720', '9750', // Groningen
];

// Official 9 Matti themes
const THEMES = [
  'School',
  'Vrienden',
  'Thuis',
  'Gevoelens',
  'Liefde',
  'Vrije Tijd',
  'Toekomst',
  'Jezelf',
  'Gewoon kletsen',
];

// Sub-themes that can appear alongside main themes
const SUB_THEMES = [
  'Pesten (algemeen)',
  'Pesten (online/cyberpesten)',
];

const REFERRAL_TYPES = [
  'jeugd-ggz',
  'wijkteam',
  'huisarts',
  'schuldhulp',
  'veilig-thuis',
];

// Helper to generate random value from array
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate random boolean with given probability
function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

// Helper to generate random themes (1-3 main themes + optional sub-theme)
function generateThemes() {
  const count = randomInt(1, 3);
  const selected = new Set();
  while (selected.size < count) {
    selected.add(randomChoice(THEMES));
  }
  
  // 20% chance to add a sub-theme (pesten)
  if (randomBool(0.2)) {
    selected.add(randomChoice(SUB_THEMES));
  }
  
  return Array.from(selected);
}

// Helper to generate timestamp in the last 30 days
function generateTimestamp() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
  return new Date(randomTime);
}

// Generate a single analytics event
function generateEvent() {
  const appName = randomChoice(APPS);
  const userType = randomChoice(USER_TYPES);
  const themes = generateThemes();
  const themeCount = themes.length;
  const isHighRisk = themeCount >= 3;
  const hasReferral = randomBool(0.15); // 15% chance of referral
  const isReturningUser = randomBool(0.4); // 40% returning users
  
  const event = {
    appName,
    timestamp: generateTimestamp(),
    postalCodeArea: randomChoice(POSTAL_CODES),
    ageGroup: randomChoice(AGE_GROUPS),
    userType,
    themes,
    sessionDuration: randomInt(120, 1800), // 2-30 minutes in seconds
    messageCount: randomInt(3, 30),
    isReturningUser,
    weeklyFrequency: isReturningUser ? randomInt(1, 5) : 1,
    isHighRisk,
    safetySignal: randomBool(0.02), // 2% safety signals
  };

  // Add family type for parent users
  if (userType === 'ouder') {
    event.familyType = randomChoice(FAMILY_TYPES);
  }

  // Add referral data for some users
  if (hasReferral) {
    event.referralType = randomChoice(REFERRAL_TYPES);
    event.daysToReferral = randomInt(1, 60);
  }

  // Add satisfaction score for some users (60% provide feedback)
  if (randomBool(0.6)) {
    event.satisfactionScore = randomInt(5, 10);
  }

  // Add self-reported improvement for returning users (50% report improvement)
  if (isReturningUser && randomBool(0.5)) {
    event.selfReportedImprovement = true;
  }

  return event;
}

// Main seed function
async function seedTestData() {
  console.log('🌱 Starting test data generation...');
  
  try {
    // Generate 250 events for good data distribution
    const events = [];
    for (let i = 0; i < 250; i++) {
      events.push(generateEvent());
    }

    console.log(`📊 Generated ${events.length} analytics events`);
    console.log('💾 Inserting into database...');

    // Insert in batches of 50 to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await db.insert(analyticsEvents).values(batch);
      console.log(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`);
    }

    console.log('✅ Test data seeded successfully!');
    console.log('\n📈 Data Summary:');
    console.log(`   Total Events: ${events.length}`);
    console.log(`   Apps: ${[...new Set(events.map(e => e.appName))].join(', ')}`);
    console.log(`   Date Range: ${new Date(Math.min(...events.map(e => e.timestamp))).toLocaleDateString('nl-NL')} - ${new Date(Math.max(...events.map(e => e.timestamp))).toLocaleDateString('nl-NL')}`);
    console.log(`   High Risk Users: ${events.filter(e => e.isHighRisk).length}`);
    console.log(`   Safety Signals: ${events.filter(e => e.safetySignal).length}`);
    console.log(`   Referrals: ${events.filter(e => e.referralType).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
