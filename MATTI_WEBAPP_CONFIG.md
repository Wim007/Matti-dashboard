# Matti Webapp Analytics Configuration

## API Endpoint
```
POST https://3000-ig0nvibh1ceu0bbrws20i-3a22751a.us1.manus.computer/api/analytics/events
```

## Authentication
Use API Key in header:
```
X-API-Key: ak_zy2WNb1DSOt9ahf4HuklLfvie12eRn8WT7hD2OxMM_IuIkAK
```

## Configuration Steps

### 1. Locate Analytics Configuration File
In the Matti webapp repository (`Wim007/matti-webapp-nieuw`), find the analytics configuration:
- Likely location: `server/analyticsRouter.ts` or `server/config/analytics.ts`
- Or environment config: `.env` or `server/config/env.ts`

### 2. Add API Key
Add the API key as an environment variable:

**Option A: Environment Variable (.env file)**
```env
ANALYTICS_API_KEY=ak_zy2WNb1DSOt9ahf4HuklLfvie12eRn8WT7hD2OxMM_IuIkAK
ANALYTICS_ENDPOINT=https://3000-ig0nvibh1ceu0bbrws20i-3a22751a.us1.manus.computer/api/analytics/events
```

**Option B: Direct in Config File**
```typescript
export const analyticsConfig = {
  apiKey: 'ak_zy2WNb1DSOt9ahf4HuklLfvie12eRn8WT7hD2OxMM_IuIkAK',
  endpoint: 'https://3000-ig0nvibh1ceu0bbrws20i-3a22751a.us1.manus.computer/api/analytics/events',
};
```

### 3. Update Analytics Service
Ensure the analytics service sends the API key in headers:

```typescript
// Example: server/services/analyticsService.ts or similar
async function sendAnalyticsEvent(event: AnalyticsEvent) {
  const response = await fetch(process.env.ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ANALYTICS_API_KEY, // ← Add this header
    },
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    console.error('Analytics event failed:', await response.text());
  }
}
```

### 4. Event Format
The endpoint expects events with this structure:

```typescript
// SESSION_START event
{
  "type": "SESSION_START",
  "userId": "user-123",
  "leeftijd": 15,
  "leeftijdsgroep": "15-17",
  "gemeente": "1012",  // Postcode
  "is_new_user": true,
  "timestamp": "2026-02-07T17:30:00Z",
  "app_type": "matti"
}

// MESSAGE_SENT event
{
  "type": "MESSAGE_SENT",
  "sessionId": "session-456",
  "theme": "School",
  "messageCount": 5,
  "sentiment": "positive"
}

// RISK_DETECTED event
{
  "type": "RISK_DETECTED",
  "sessionId": "session-456",
  "riskLevel": "high",
  "riskType": "pesten",
  "action_taken": "referral_suggested"
}

// SESSION_END event
{
  "type": "SESSION_END",
  "sessionId": "session-456",
  "duration_seconds": 180,
  "total_messages": 10,
  "satisfaction_score": 8
}
```

### 5. Test Integration
After configuration, test by:
1. Starting the Matti webapp locally
2. Performing an action that triggers analytics (e.g., sending a message)
3. Checking the Dashboard "Totaal Gebeurtenissen" counter increases
4. Verifying the event appears in the database

### 6. Verify in Dashboard
Open the Dashboard and check:
- **Dashboard page**: "Totaal Gebeurtenissen" should increase
- **Demografie page**: New user should appear in age group distribution
- **Thema's page**: Theme should appear if MESSAGE_SENT was sent

## Troubleshooting

### 401 Unauthorized
- Check API key is correct
- Verify `X-API-Key` header is being sent
- Confirm API key is active in Dashboard (API-sleutels page)

### 400 Bad Request
- Check event has `type` field (not `eventType`)
- Verify JSON structure matches expected format
- Check required fields are present

### 500 Server Error
- Check Dashboard server logs
- Verify database connection is working
- Contact Dashboard administrator

## Production Deployment
For production:
1. Create a new API key in Dashboard with name "Matti Webapp Production"
2. Update environment variables in production deployment
3. Use HTTPS endpoint (already configured)
4. Monitor Dashboard for incoming events
