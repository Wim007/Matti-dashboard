import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, createApiKey } from './db';
import { analyticsEvents } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('POST /api/analytics/event (REST endpoint)', () => {
  let testApiKey: string;
  const API_URL = 'http://localhost:3000';

  beforeAll(async () => {
    // Create a test API key
    testApiKey = `ak_rest_test_${nanoid(48)}`;
    
    try {
      await createApiKey({
        key: testApiKey,
        name: 'REST Test Key',
        appName: 'matti',
        createdBy: 1,
        isActive: true,
      });
    } catch (error) {
      console.log('API key creation skipped (database not available)');
    }
  });

  it('should reject request without API key', async () => {
    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '1234',
        ageGroup: '13-15',
        userType: 'jongere',
        themes: ['school', 'stress'],
        sessionDuration: 15,
        messageCount: 10,
        isHighRisk: false,
        safetySignal: false,
      }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Missing X-API-Key');
  });

  it('should reject request with invalid API key', async () => {
    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid_key_12345',
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '1234',
        ageGroup: '13-15',
        userType: 'jongere',
        themes: ['school', 'stress'],
        sessionDuration: 15,
        messageCount: 10,
        isHighRisk: false,
        safetySignal: false,
      }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Invalid or inactive');
  });

  it('should reject request with missing required fields', async () => {
    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        appName: 'matti',
        // Missing required fields
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing or invalid required fields');
  });

  it('should accept valid analytics event from Matti integration', async () => {
    const db = await getDb();
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '1234',
        ageGroup: '13-15',
        userType: 'jongere',
        themes: ['school', 'stress', 'pesten'],
        sessionDuration: 15,
        messageCount: 10,
        isHighRisk: true,
        safetySignal: false,
        satisfactionScore: 8,
        selfReportedImprovement: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify event was inserted
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.postalCodeArea, '1234'))
      .limit(1);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].appName).toBe('matti');
    expect(events[0].themes).toEqual(['school', 'stress', 'pesten']);
    expect(events[0].isHighRisk).toBe(true);
  });

  it('should handle themes as JSON array correctly', async () => {
    const db = await getDb();
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '5678',
        ageGroup: '16-18',
        userType: 'jongere',
        themes: ['identiteit', 'relaties', 'toekomst', 'emoties'],
        sessionDuration: 25,
        messageCount: 12,
        isHighRisk: true,
        safetySignal: false,
      }),
    });

    expect(response.status).toBe(200);

    // Verify themes stored correctly as JSON array
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.postalCodeArea, '5678'))
      .limit(1);

    expect(events[0].themes).toEqual(['identiteit', 'relaties', 'toekomst', 'emoties']);
    expect(Array.isArray(events[0].themes)).toBe(true);
    expect(events[0].themes.length).toBe(4);
  });

  it('should accept minimal required fields only', async () => {
    const db = await getDb();
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '9999',
        ageGroup: '19-25',
        userType: 'jongere',
        themes: ['werk'],
        sessionDuration: 10,
        messageCount: 5,
        isHighRisk: false,
        safetySignal: false,
        // No optional fields
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle safety signals correctly', async () => {
    const db = await getDb();
    if (!db) {
      console.log('Skipping test: database not available');
      return;
    }

    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
      },
      body: JSON.stringify({
        appName: 'matti',
        postalCodeArea: '3333',
        ageGroup: '13-15',
        userType: 'jongere',
        themes: ['emoties', 'gezondheid'],
        sessionDuration: 20,
        messageCount: 8,
        isHighRisk: true,
        safetySignal: true, // Safety signal detected
      }),
    });

    expect(response.status).toBe(200);

    // Verify safety signal was stored
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.postalCodeArea, '3333'))
      .limit(1);

    expect(events[0].safetySignal).toBe(true);
    expect(events[0].isHighRisk).toBe(true);
  });
});
