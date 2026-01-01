/**
 * Generate test data for funding-related features
 * - Improvement scores (theme-based 1-10 tracking)
 * - Referral tracking (prevented care)
 * - Cost configuration
 */

import { getDb } from '../server/db';
import { improvementScores, referralTracking, costConfig } from '../drizzle/schema';

const THEMES = [
  'pesten', 'school', 'stress', 'identiteit', 'relaties',
  'ouders', 'gezin', 'toekomst', 'emoties', 'vriendschap',
  'zelfvertrouwen', 'schulden', 'werk', 'gezondheid'
];

const CARE_TYPES = ['jeugd_ggz', 'veilig_thuis', 'specialistische_zorg', 'uithuisplaatsing'] as const;

async function seedFundingData() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log('🌱 Seeding funding data...\n');

  // 1. Initialize cost configuration
  console.log('📊 Setting up cost configuration...');
  const costs = [
    { careType: 'jeugd_ggz', costAmount: 8000, description: 'Gemiddelde kosten per Jeugd-GGZ traject', updatedBy: 1 },
    { careType: 'specialistische_zorg', costAmount: 15000, description: 'Gemiddelde kosten per specialistische zorg traject', updatedBy: 1 },
    { careType: 'uithuisplaatsing', costAmount: 50000, description: 'Gemiddelde kosten per uithuisplaatsing per jaar', updatedBy: 1 },
    { careType: 'veilig_thuis', costAmount: 5000, description: 'Gemiddelde kosten per Veilig Thuis interventie', updatedBy: 1 },
  ];

  for (const cost of costs) {
    try {
      await db.insert(costConfig).values(cost);
      console.log(`  ✓ ${cost.careType}: €${cost.costAmount.toLocaleString()}`);
    } catch (error) {
      // Ignore duplicate key errors
      if (!(error instanceof Error && error.message.includes('Duplicate'))) {
        console.error(`  ✗ Error inserting ${cost.careType}:`, error);
      }
    }
  }

  // 2. Generate improvement scores (50 completed measurements)
  console.log('\n📈 Generating improvement scores...');
  const improvementData = [];
  
  for (let i = 0; i < 50; i++) {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const scoreStart = Math.floor(Math.random() * 4) + 5; // 5-8 (problems start moderate-high)
    const improvement = Math.random() * 0.5 + 0.2; // 20-70% improvement
    const scoreCurrent = Math.max(1, Math.round(scoreStart * (1 - improvement)));
    
    const measuredAt = new Date();
    measuredAt.setDate(measuredAt.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
    
    const followUpAt = new Date(measuredAt);
    followUpAt.setDate(followUpAt.getDate() + Math.floor(Math.random() * 14) + 7); // 1-3 weeks later
    
    improvementData.push({
      userId: `user_${Math.floor(Math.random() * 30) + 1}`, // 30 unique users
      theme,
      scoreStart,
      scoreCurrent,
      measuredAt,
      followUpAt,
      appName: Math.random() > 0.5 ? 'matti' as const : 'opvoedmaatje' as const,
    });
  }

  try {
    await db.insert(improvementScores).values(improvementData);
    console.log(`  ✓ Created ${improvementData.length} improvement measurements`);
    
    // Calculate and display stats
    const avgImprovement = improvementData.reduce((sum, item) => {
      const improvement = ((item.scoreStart - item.scoreCurrent) / item.scoreStart) * 100;
      return sum + improvement;
    }, 0) / improvementData.length;
    
    console.log(`  📊 Average improvement: ${avgImprovement.toFixed(1)}%`);
  } catch (error) {
    console.error('  ✗ Error inserting improvement scores:', error);
  }

  // 3. Generate referral tracking (prevented care)
  console.log('\n🛡️  Generating referral tracking data...');
  const referralData = [];
  
  // 80% of users didn't need referral (prevented care)
  for (let i = 0; i < 80; i++) {
    const preventedCareType = CARE_TYPES[Math.floor(Math.random() * CARE_TYPES.length)];
    const trackedAt = new Date();
    trackedAt.setDate(trackedAt.getDate() - Math.floor(Math.random() * 60));
    
    referralData.push({
      userId: `user_${Math.floor(Math.random() * 100) + 1}`,
      hadReferral: false,
      preventedCareType,
      appName: Math.random() > 0.5 ? 'matti' as const : 'opvoedmaatje' as const,
      trackedAt,
    });
  }
  
  // 20% needed referral
  for (let i = 0; i < 20; i++) {
    const trackedAt = new Date();
    trackedAt.setDate(trackedAt.getDate() - Math.floor(Math.random() * 60));
    
    referralData.push({
      userId: `user_${Math.floor(Math.random() * 100) + 1}`,
      hadReferral: true,
      preventedCareType: null,
      appName: Math.random() > 0.5 ? 'matti' as const : 'opvoedmaatje' as const,
      trackedAt,
    });
  }

  try {
    await db.insert(referralTracking).values(referralData);
    console.log(`  ✓ Created ${referralData.length} referral tracking records`);
    
    // Calculate prevented care breakdown
    const preventedCounts = referralData
      .filter(r => !r.hadReferral && r.preventedCareType)
      .reduce((acc, r) => {
        acc[r.preventedCareType!] = (acc[r.preventedCareType!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    console.log('  📊 Prevented care breakdown:');
    Object.entries(preventedCounts).forEach(([type, count]) => {
      const cost = costs.find(c => c.careType === type)?.costAmount || 0;
      console.log(`    - ${type}: ${count} cases (€${(count * cost).toLocaleString()} saved)`);
    });
    
    const totalSaved = Object.entries(preventedCounts).reduce((sum, [type, count]) => {
      const cost = costs.find(c => c.careType === type)?.costAmount || 0;
      return sum + (count * cost);
    }, 0);
    
    console.log(`  💰 Total avoided costs: €${totalSaved.toLocaleString()}`);
  } catch (error) {
    console.error('  ✗ Error inserting referral tracking:', error);
  }

  console.log('\n✅ Funding data seeding complete!');
  process.exit(0);
}

seedFundingData().catch(console.error);
