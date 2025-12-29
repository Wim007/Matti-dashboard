# Analytics Dashboard Integration Guide

This guide explains how to integrate the Analytics Dashboard with Matti and Opvoedmaatje apps to collect anonymized usage data.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [API Authentication](#api-authentication)
4. [TypeScript Client Library](#typescript-client-library)
5. [Integration Steps](#integration-steps)
6. [Data Privacy](#data-privacy)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Overview

The Analytics Dashboard provides a centralized platform for collecting, storing, and visualizing anonymized usage data from family support apps. The system uses a REST API architecture with tRPC for type-safe communication.

**Key Features:**

- **Anonymized Data Collection**: All personally identifiable information is removed or aggregated before transmission
- **Type-Safe Integration**: TypeScript client library ensures correct data structure
- **Silent Failures**: Analytics errors never disrupt the user experience
- **Opt-In Support**: Built-in user consent management
- **Real-Time Dashboards**: Immediate visibility into usage patterns and risk metrics

## Getting Started

### Prerequisites

- Node.js 18+ or compatible JavaScript runtime
- TypeScript 4.5+ (recommended)
- API key from the Analytics Dashboard (contact admin)

### Installation

Copy the `analytics-sender.ts` file into your project:

```bash
cp analytics-sender.ts src/lib/analytics-sender.ts
```

No external dependencies are required—the library uses only native `fetch` API.

## API Authentication

The Analytics Dashboard uses API key authentication via the X-API-Key header. Each app (Matti or Opvoedmaatje) receives a unique API key.

### Obtaining an API Key

1. Log in to the Analytics Dashboard as an admin
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Enter a descriptive name (e.g., "Production Matti Key")
5. Select the app name (matti or opvoedmaatje)
6. Copy the generated key immediately (it won't be shown again)

### Storing API Keys Securely

**Never commit API keys to version control.** Store them in environment variables:

```bash
# .env.local
ANALYTICS_API_URL=https://your-dashboard.manus.space
ANALYTICS_API_KEY=ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## TypeScript Client Library

The `analytics-sender.ts` library provides a complete type-safe interface for analytics integration.

### Configuration

Create an analytics configuration object:

```typescript
import { AnalyticsConfig } from './lib/analytics-sender';

const analyticsConfig: AnalyticsConfig = {
  apiUrl: process.env.ANALYTICS_API_URL || "https://your-dashboard.manus.space",
  apiKey: process.env.ANALYTICS_API_KEY || "",
  appName: "matti", // or "opvoedmaatje"
};
```

### Core Functions

#### `sendAnalytics(event, config)`

Sends an analytics event to the dashboard. Automatically checks opt-in status and handles errors silently.

```typescript
await sendAnalytics(event, analyticsConfig);
```

#### `buildAnalyticsEvent(conversation, userProfile, appName)`

Builds a complete analytics event from conversation and user data.

```typescript
const event = buildAnalyticsEvent(conversation, userProfile, "matti");
```

#### `getAnalyticsOptIn()` / `setAnalyticsOptIn(optIn)`

Manages user consent for analytics collection.

```typescript
const hasOptIn = await getAnalyticsOptIn();
await setAnalyticsOptIn(true);
```

### Helper Functions

- **`anonymizePostalCode(postalCode)`**: Converts full postal code to anonymized area (e.g., "3011AB" → "3000-3099")
- **`getAgeGroup(age)`**: Maps age to predefined age groups (e.g., 14 → "13-15")
- **`calculateSessionDuration(startTime, endTime)`**: Calculates session duration in seconds
- **`calculateDaysBetween(startDate, endDate)`**: Calculates days between two dates

## Integration Steps

### Step 1: Add Opt-In UI

Add a consent checkbox to your app's settings or onboarding flow:

```typescript
import { setAnalyticsOptIn } from './lib/analytics-sender';

function SettingsPage() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    await setAnalyticsOptIn(enabled);
    setAnalyticsEnabled(enabled);
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={analyticsEnabled}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      Help improve the app by sharing anonymous usage data
    </label>
  );
}
```

### Step 2: Collect Conversation Data

Track conversation metadata during the session:

```typescript
interface ConversationData {
  startTime: Date;
  endTime: Date;
  messages: Array<{ role: string; content: string }>;
  themes: string[];
  referral?: {
    type: "jeugd-ggz" | "wijkteam" | "huisarts" | "schuldhulp" | "veilig-thuis";
    date: Date;
  };
  satisfactionScore?: number;
  selfReportedImprovement?: boolean;
  safetySignal?: boolean;
}

// Example: Track conversation start
const conversationData: ConversationData = {
  startTime: new Date(),
  endTime: new Date(), // Updated when conversation ends
  messages: [],
  themes: [],
  safetySignal: false,
};

// Example: Detect themes from conversation
function detectThemes(messages: Array<{ content: string }>): string[] {
  const themes = new Set<string>();
  const keywords = {
    school: ["school", "homework", "grades", "teacher"],
    pesten: ["bullying", "pesten", "teasing"],
    gezin: ["family", "parents", "siblings"],
    // Add more theme keywords
  };

  messages.forEach(msg => {
    Object.entries(keywords).forEach(([theme, words]) => {
      if (words.some(word => msg.content.toLowerCase().includes(word))) {
        themes.add(theme);
      }
    });
  });

  return Array.from(themes);
}
```

### Step 3: Send Analytics After Conversation

When the conversation ends, build and send the analytics event:

```typescript
import { sendAnalytics, buildAnalyticsEvent } from './lib/analytics-sender';

async function handleConversationEnd(
  conversation: ConversationData,
  userProfile: UserProfile
) {
  try {
    // Update end time
    conversation.endTime = new Date();

    // Detect themes
    conversation.themes = detectThemes(conversation.messages);

    // Build analytics event
    const event = buildAnalyticsEvent(
      conversation,
      userProfile,
      analyticsConfig.appName
    );

    // Send to dashboard (silent failure if error occurs)
    await sendAnalytics(event, analyticsConfig);
  } catch (error) {
    console.error("Analytics error:", error);
    // Don't throw - analytics should never crash the app
  }
}
```

### Step 4: Handle User Profile Data

Ensure you have the required user profile data:

```typescript
interface UserProfile {
  postalCode?: string;        // Full postal code (will be anonymized)
  age?: number;               // User's age
  userType: "jongere" | "ouder";
  familyType?: "eenouder" | "tweeouder" | "samengesteld";
  firstVisit?: Date;          // Date of first app usage
  visitCount?: number;        // Total number of visits
}

// Example: Load user profile
async function getUserProfile(userId: string): Promise<UserProfile> {
  const profile = await database.users.findOne({ id: userId });
  return {
    postalCode: profile.postalCode,
    age: profile.age,
    userType: profile.userType,
    familyType: profile.familyType,
    firstVisit: profile.createdAt,
    visitCount: profile.visitCount,
  };
}
```

## Data Privacy

### Anonymization Principles

The analytics system follows strict privacy principles:

1. **Postal Code Aggregation**: Full postal codes are converted to area ranges (e.g., "3000-3099")
2. **Age Grouping**: Exact ages are mapped to age ranges (e.g., "13-15")
3. **No Personal Identifiers**: Names, emails, and user IDs are never transmitted
4. **Opt-In Required**: Data is only sent if the user has explicitly consented
5. **Theme-Based Analysis**: Conversation content is reduced to theme tags only

### GDPR Compliance

The system is designed to comply with GDPR requirements:

- **Consent Management**: Built-in opt-in/opt-out functionality
- **Data Minimization**: Only essential anonymized data is collected
- **Right to Erasure**: Contact dashboard admin to remove data
- **Transparency**: Users are informed about data collection

## Testing

### Testing with Sample Data

Create a test script to verify integration:

```typescript
import { sendAnalytics, buildAnalyticsEvent } from './lib/analytics-sender';

async function testAnalytics() {
  const testConversation: ConversationData = {
    startTime: new Date(Date.now() - 720000), // 12 minutes ago
    endTime: new Date(),
    messages: [
      { role: "user", content: "I'm having trouble at school" },
      { role: "assistant", content: "I'm here to help..." },
      // Add more messages
    ],
    themes: ["school", "stress"],
    satisfactionScore: 8,
    selfReportedImprovement: true,
    safetySignal: false,
  };

  const testProfile: UserProfile = {
    postalCode: "3011AB",
    age: 14,
    userType: "jongere",
    firstVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    visitCount: 3,
  };

  const event = buildAnalyticsEvent(testConversation, testProfile, "matti");
  console.log("Test event:", JSON.stringify(event, null, 2));

  await sendAnalytics(event, analyticsConfig);
  console.log("Test event sent successfully");
}

testAnalytics();
```

### Verifying Data in Dashboard

1. Log in to the Analytics Dashboard
2. Navigate to **Overview** to see total events
3. Check **Demographics** for age group and postal code distribution
4. Verify **Engagement** metrics show session duration and message counts

## Troubleshooting

### Common Issues

**Issue: Events not appearing in dashboard**

- Verify API key is correct and active (check API Keys page)
- Ensure user has opted in to analytics
- Check browser console for error messages
- Verify API URL is correct

**Issue: TypeScript compilation errors**

- Ensure TypeScript version is 4.5 or higher
- Check that all required fields are provided in event object
- Verify enum types match exactly (e.g., "jongere" not "Jongere")

**Issue: CORS errors in browser**

- The dashboard API is configured to accept requests from any origin
- If you see CORS errors, contact the dashboard admin

### Debug Mode

Enable verbose logging for troubleshooting:

```typescript
// Add to analytics-sender.ts
const DEBUG = process.env.NODE_ENV === "development";

export async function sendAnalytics(event: AnalyticsEvent, config: AnalyticsConfig) {
  if (DEBUG) {
    console.log("[Analytics Debug] Sending event:", event);
  }
  
  // ... rest of function
}
```

### Support

For integration support or questions:

- Contact the Analytics Dashboard administrator
- Check the dashboard's API Keys page for key status
- Review the TypeScript types in `analytics-sender.ts` for field requirements

## API Reference

### POST /api/trpc/analytics.submitEvent

Submit an analytics event to the dashboard.

**Request Body:**

```json
{
  "apiKey": "ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "event": {
    "appName": "matti",
    "timestamp": "2024-12-29T10:30:00Z",
    "postalCodeArea": "3000-3099",
    "ageGroup": "13-15",
    "userType": "jongere",
    "themes": ["school", "pesten"],
    "sessionDuration": 720,
    "messageCount": 12,
    "isReturningUser": true,
    "weeklyFrequency": 3,
    "isHighRisk": false,
    "safetySignal": false
  }
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Analytics event recorded successfully"
}
```

**Response (Error):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `appName` | `"matti" \| "opvoedmaatje"` | Yes | App identifier |
| `timestamp` | `string` (ISO 8601) | Yes | Event timestamp |
| `postalCodeArea` | `string` | Yes | Anonymized postal code area |
| `ageGroup` | `string` | Yes | Age group (e.g., "13-15") |
| `userType` | `"jongere" \| "ouder"` | Yes | User type |
| `familyType` | `"eenouder" \| "tweeouder" \| "samengesteld"` | No | Family type (ouder only) |
| `themes` | `string[]` | Yes | Conversation themes |
| `sessionDuration` | `number` | Yes | Duration in seconds |
| `messageCount` | `number` | Yes | Number of messages |
| `isReturningUser` | `boolean` | Yes | Whether user has visited before |
| `weeklyFrequency` | `number` | Yes | Visits this week |
| `referralType` | `"jeugd-ggz" \| "wijkteam" \| "huisarts" \| "schuldhulp" \| "veilig-thuis"` | No | Referral type |
| `daysToReferral` | `number` | No | Days to referral |
| `satisfactionScore` | `number` (1-10) | No | User satisfaction |
| `selfReportedImprovement` | `boolean` | No | User reported improvement |
| `isHighRisk` | `boolean` | Yes | High risk flag (≥3 themes) |
| `safetySignal` | `boolean` | Yes | Safety signal detected |

## Best Practices

1. **Always Check Opt-In**: Never send analytics without user consent
2. **Handle Errors Silently**: Analytics should never crash your app
3. **Batch Events**: Consider queuing events and sending in batches for better performance
4. **Validate Data**: Ensure all required fields are present before sending
5. **Test Thoroughly**: Use test mode to verify integration before production
6. **Monitor API Key Usage**: Check the dashboard's API Keys page for usage statistics
7. **Update Themes Regularly**: Keep theme detection keywords up to date with app content
8. **Respect Privacy**: Never include personally identifiable information in analytics data

## Example: Complete Integration

Here's a complete example of integrating analytics into a chat application:

```typescript
import { sendAnalytics, buildAnalyticsEvent, AnalyticsConfig } from './lib/analytics-sender';

// Configuration
const analyticsConfig: AnalyticsConfig = {
  apiUrl: process.env.ANALYTICS_API_URL!,
  apiKey: process.env.ANALYTICS_API_KEY!,
  appName: "matti",
};

// Chat session manager
class ChatSession {
  private conversation: ConversationData;
  private userProfile: UserProfile;

  constructor(userProfile: UserProfile) {
    this.userProfile = userProfile;
    this.conversation = {
      startTime: new Date(),
      endTime: new Date(),
      messages: [],
      themes: [],
      safetySignal: false,
    };
  }

  addMessage(role: string, content: string) {
    this.conversation.messages.push({ role, content });
    
    // Check for safety signals
    if (this.detectSafetySignal(content)) {
      this.conversation.safetySignal = true;
    }
  }

  detectSafetySignal(content: string): boolean {
    const dangerKeywords = ["harm", "hurt", "suicide", "kill"];
    return dangerKeywords.some(word => 
      content.toLowerCase().includes(word)
    );
  }

  async end(satisfactionScore?: number, improvement?: boolean) {
    this.conversation.endTime = new Date();
    this.conversation.satisfactionScore = satisfactionScore;
    this.conversation.selfReportedImprovement = improvement;
    
    // Detect themes
    this.conversation.themes = this.detectThemes();

    // Send analytics
    try {
      const event = buildAnalyticsEvent(
        this.conversation,
        this.userProfile,
        analyticsConfig.appName
      );
      await sendAnalytics(event, analyticsConfig);
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }

  private detectThemes(): string[] {
    // Implement theme detection logic
    return ["school", "stress"];
  }
}

// Usage
const userProfile = await getUserProfile(userId);
const session = new ChatSession(userProfile);

session.addMessage("user", "I'm having trouble at school");
session.addMessage("assistant", "I'm here to help...");

await session.end(8, true);
```

---

**Last Updated**: December 29, 2024  
**Version**: 1.0.0  
**Contact**: Analytics Dashboard Administrator
