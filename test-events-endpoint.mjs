// Test script for /api/analytics/events endpoint
import { getDb, createApiKey } from './server/db.js';
import { nanoid } from 'nanoid';

const API_URL = 'http://localhost:3000';

async function testEndpoint() {
  console.log('🧪 Testing /api/analytics/events endpoint...\n');
  
  // 1. Create test API key
  console.log('1. Creating test API key...');
  const testApiKey = `ak_test_${nanoid(48)}`;
  
  try {
    await createApiKey({
      key: testApiKey,
      name: 'Test Key for Events Endpoint',
      appName: 'matti',
      createdBy: 1,
      isActive: true,
    });
    console.log('✅ API key created\n');
  } catch (error) {
    console.error('❌ Failed to create API key:', error.message);
    return;
  }
  
  // 2. Test SESSION_START event
  console.log('2. Testing SESSION_START event...');
  try {
    const response = await fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        type: 'SESSION_START',
        userId: 'test-user-123',
        leeftijd: 15,
        leeftijdsgroep: '15-17',
        gemeente: '1234',
        is_new_user: true,
        timestamp: Date.now(),
        app_type: 'matti',
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
    
    if (response.status === 200) {
      console.log('✅ SESSION_START test passed\n');
    } else {
      console.log('❌ SESSION_START test failed\n');
    }
  } catch (error) {
    console.error('❌ SESSION_START test error:', error.message, '\n');
  }
  
  // 3. Test RISK_DETECTED event
  console.log('3. Testing RISK_DETECTED event...');
  try {
    const response = await fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        type: 'RISK_DETECTED',
        sessionId: 'test-session-456',
        riskLevel: 'high',
        riskType: 'pesten',
        action_taken: 'escalated',
        timestamp: Date.now(),
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
    
    if (response.status === 200) {
      console.log('✅ RISK_DETECTED test passed\n');
    } else {
      console.log('❌ RISK_DETECTED test failed\n');
    }
  } catch (error) {
    console.error('❌ RISK_DETECTED test error:', error.message, '\n');
  }
  
  // 4. Test SESSION_END event
  console.log('4. Testing SESSION_END event...');
  try {
    const response = await fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        type: 'SESSION_END',
        sessionId: 'test-session-789',
        duration_seconds: 1200,
        total_messages: 15,
        satisfaction_score: 8,
        timestamp: Date.now(),
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
    
    if (response.status === 200) {
      console.log('✅ SESSION_END test passed\n');
    } else {
      console.log('❌ SESSION_END test failed\n');
    }
  } catch (error) {
    console.error('❌ SESSION_END test error:', error.message, '\n');
  }
  
  // 5. Test without API key (should fail)
  console.log('5. Testing without API key (should fail with 401)...');
  try {
    const response = await fetch(`${API_URL}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'SESSION_START',
        userId: 'test-user-999',
      }),
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
    
    if (response.status === 401) {
      console.log('✅ Auth test passed (correctly rejected)\n');
    } else {
      console.log('❌ Auth test failed (should have been rejected)\n');
    }
  } catch (error) {
    console.error('❌ Auth test error:', error.message, '\n');
  }
  
  console.log('🎉 All tests completed!');
}

testEndpoint().catch(console.error);
