# Analytics Dashboard API Documentation

**Project:** Thuis Maatjes Analytics Dashboard  
**Version:** 1.0.0  
**Date:** January 3, 2026  
**Tech Stack:** React 19 + tRPC 11 + Express 4 + TiDB/MySQL + Tailwind 4

---

## 📋 Overview

This dashboard receives **anonymous analytics data** from Matti (youth app) and Opvoedmaatje (parent app) and displays aggregated statistics for municipalities and insurance companies.

**Key Features:**
- Real-time KPI metrics (costs saved, improvement rates, ROI)
- Theme-based analytics (pesten, school, stress, etc.)
- Demographic breakdowns (age, postal code)
- Risk assessment and safety signals
- Impact reports with PDF export
- API key management for secure data ingestion

---

## 🔐 Authentication

### Admin Access (OAuth)
- **Method:** Manus OAuth 2.0
- **Endpoint:** `/api/oauth/callback`
- **Session:** HTTP-only cookie
- **Frontend Check:** `trpc.auth.me.useQuery()`

### API Key Authentication (Data Ingestion)
- **Method:** Bearer token in `X-API-Key` header
- **Used For:** POST `/api/analytics/event` endpoint
- **Management:** Admin UI → API-sleutels page

---

## 📡 API Endpoints

### 1. Analytics Event Ingestion

**POST `/api/analytics/event`**

Receives anonymous analytics events from Matti/Opvoedmaatje apps.

**Headers:**
```
X-API-Key: <api_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appName": "matti" | "opvoedmaatje",
  "postalCodeArea": "1234",  // First 4 digits only
  "ageGroup": "13-15" | "16-18" | "19-25" | "26-35" | "36-45" | "46+",
  "userType": "jongere" | "ouder" | "samengesteld",
  "familyType": "tweeling" | "eenouder" | "samengesteld" | "adoptie" | "pleegzorg" | null,
  "themes": ["school", "stress", "pesten"],  // Array of theme strings
  "sessionDuration": 15,  // minutes
  "messageCount": 8,
  "isHighRisk": false,
  "safetySignal": false,
  "satisfactionScore": 8,  // 1-10, optional
  "selfReportedImprovement": true,  // optional
  "referralType": "jeugd-ggz" | "wijkteam" | "huisarts" | "schuldhulp" | "veilig-thuis" | null
}
```

**Response:**
```json
{
  "success": true,
  "eventId": 123
}
```

**Privacy:** All data is anonymous. No names, user IDs, or conversation content.

---

### 2. tRPC Endpoints (Frontend ↔ Backend)

All tRPC endpoints are under `/api/trpc/*` and use **superjson** for serialization (Dates stay Dates).

#### **Analytics Router** (`trpc.analytics.*`)

**`submitEvent`** (mutation)
- Same as POST `/api/analytics/event` but via tRPC
- Input: `AnalyticsEventSchema` (Zod validated)
- Output: `{ success: boolean, eventId: number }`

**`getOverview`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  totalEvents: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalMessages: number;
  satisfactionScore: number;
}
```

**`getThemeFrequency`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
Array<{
  theme: string;
  count: number;
  percentage: number;
}>
```

**`getDemographics`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  ageGroups: Array<{ ageGroup: string; count: number }>;
  postalCodes: Array<{ postalCode: string; count: number }>;
  userTypes: Array<{ userType: string; count: number }>;
}
```

**`getEngagement`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  averageSessionDuration: number;
  averageMessageCount: number;
  dailyActivity: Array<{
    date: string;  // YYYY-MM-DD
    eventCount: number;
    uniqueUsers: number;
  }>;
}
```

**`getRiskMetrics`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  highRiskCount: number;
  safetySignalCount: number;
  improvementRate: number;
  riskTrend: Array<{
    date: string;  // YYYY-MM-DD
    highRiskCount: number;
    safetySignalCount: number;
  }>;
}
```

#### **Funding Router** (`trpc.funding.*`)

**`getAvoidedCosts`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  totalAvoidedCosts: number;  // in euros
  breakdown: {
    jeugdGgz: number;
    specialistischeZorg: number;
    uithuisplaatsing: number;
    veiligThuis: number;
  };
}
```

**`getEscalationPrevention`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  totalHighRisk: number;
  stabilized: number;
  referred: number;
  preventionRate: number;  // 0-1 (percentage as decimal)
}
```

**`getImprovementMetrics`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  averageImprovement: number;  // percentage
  totalMeasurements: number;
  averageConversations: number;
  byTheme: Array<{
    theme: string;
    improvement: number;  // percentage
    measurementCount: number;
  }>;
}
```

**`getSpeedToHelp`** (query)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  appWaitTime: number;  // days (usually 0)
  traditionalWaitTime: number;  // days (e.g., 120)
  timeSaved: number;  // days
}
```

**`getCostConfig`** (query)
- Output:
```typescript
{
  jeugdGgz: number;
  specialistischeZorg: number;
  uithuisplaatsing: number;
  veiligThuis: number;
}
```

**`updateCostConfig`** (mutation)
- Input: Same as getCostConfig output
- Output: `{ success: boolean }`

#### **PDF Router** (`trpc.pdf.*`)

**`generateImpactReport`** (mutation)
- Input: `{ startDate: Date, endDate: Date }`
- Output:
```typescript
{
  pdfBuffer: Buffer;  // PDF file as buffer
  filename: string;   // e.g., "Impact_Rapport_2026-01-03.pdf"
}
```

#### **API Keys Router** (`trpc.apiKeys.*`)

**`list`** (query)
- Output:
```typescript
Array<{
  id: number;
  name: string;
  key: string;  // Masked: "mk_***abc"
  createdAt: Date;
  lastUsedAt: Date | null;
}>
```

**`create`** (mutation)
- Input: `{ name: string }`
- Output:
```typescript
{
  id: number;
  name: string;
  key: string;  // Full key, shown only once!
  createdAt: Date;
}
```

**`delete`** (mutation)
- Input: `{ id: number }`
- Output: `{ success: boolean }`

---

## 🗄️ Database Schema

### **analyticsEvents** Table
```sql
CREATE TABLE analyticsEvents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appName VARCHAR(50) NOT NULL,
  postalCodeArea VARCHAR(4) NOT NULL,
  ageGroup VARCHAR(20) NOT NULL,
  userType VARCHAR(50) NOT NULL,
  familyType VARCHAR(50),
  themes JSON NOT NULL,  -- Array of strings
  sessionDuration INT NOT NULL,
  messageCount INT NOT NULL,
  isHighRisk BOOLEAN NOT NULL DEFAULT FALSE,
  safetySignal BOOLEAN NOT NULL DEFAULT FALSE,
  satisfactionScore INT,
  selfReportedImprovement BOOLEAN,
  referralType VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **improvementScores** Table
```sql
CREATE TABLE improvementScores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(255) NOT NULL,  -- Anonymous hash
  appName VARCHAR(50) NOT NULL,
  theme VARCHAR(100) NOT NULL,
  scoreStart INT NOT NULL,  -- 1-10
  scoreCurrent INT,  -- 1-10, null until follow-up
  measuredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **referralTracking** Table
```sql
CREATE TABLE referralTracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(255) NOT NULL,  -- Anonymous hash
  appName VARCHAR(50) NOT NULL,
  hadReferral BOOLEAN NOT NULL DEFAULT FALSE,
  referralType VARCHAR(100),
  preventedCareType VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **costConfig** Table
```sql
CREATE TABLE costConfig (
  id INT PRIMARY KEY AUTO_INCREMENT,
  careType VARCHAR(100) NOT NULL UNIQUE,
  costEuros INT NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **apiKeys** Table
```sql
CREATE TABLE apiKeys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  keyHash VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt TIMESTAMP
);
```

---

## 📊 Dashboard Pages

### 1. **Overzicht (Dashboard)** - `/`
**KPIs:**
- Totaal Gebeurtenissen
- Unieke Gebruikers
- Vermeden Zorgkosten (€)
- Escalatie Voorkomen (%)
- Snelheid Hulp (dagen)
- Verbetering na Gesprekken (%)

**Sections:**
- Betrokkenheidsstatistieken (session duration, messages, satisfaction)
- Risicobeoordeling (high-risk users, safety signals, improvement)

### 2. **Demografie** - `/demographics`
**Visualizations:**
- Leeftijd Verdeling (bar chart)
- Postcode Verdeling (bar chart)
- Gebruikerstype Verdeling (pie chart)
- Thema Frequentie Analyse (horizontal bar chart with counts)

### 3. **Betrokkenheid** - `/engagement`
**Visualizations:**
- Dagelijkse Activiteit (line chart: events + unique users over time)
- Gem. Sessieduur (stat)
- Gem. Berichten per Sessie (stat)
- Tevredenheidsscore (stat)

### 4. **Risicobeoordeling** - `/risk-assessment`
**KPIs:**
- Hoog Risico Gebruikers
- Veiligheidssignalen
- Verbeteringspercentage

**Visualizations:**
- Risico Trend Analyse (area chart: high-risk + safety signals over time)
- Verbetering per Thema (horizontal bar chart with color coding)

### 5. **Impact Rapport** - `/impact-report`
**Sections:**
- Executive Summary (4 key KPIs)
- ROI Visualization (bar chart: costs vs savings)
- Cost Breakdown (detailed table per care type)
- Key Insights (4 bullet points)
- Recommendations (3 action items)
- **PDF Export** button (downloads formatted PDF)

### 6. **API-sleutels** - `/api-keys`
**Features:**
- List all API keys (masked)
- Create new API key
- Delete API key
- Last used timestamp

---

## 🎨 Frontend Tech Stack

**Framework:** React 19 + TypeScript  
**Styling:** Tailwind CSS 4 + shadcn/ui components  
**Data Fetching:** tRPC 11 with React Query  
**Charts:** Recharts  
**Date Handling:** date-fns  
**Forms:** React Hook Form + Zod validation  

**Key Components:**
- `DashboardLayout.tsx` - Sidebar navigation + auth wrapper
- `Dashboard.tsx` - Overview page with KPIs
- `Demographics.tsx` - Demographic visualizations
- `Engagement.tsx` - Activity and engagement metrics
- `RiskAssessment.tsx` - Risk metrics and improvement tracking
- `ImpactReport.tsx` - Executive summary + PDF export
- `ApiKeys.tsx` - API key management

---

## 🔒 Privacy Compliance

**✅ What the dashboard shows:**
- Aggregated statistics (counts, averages, percentages)
- Postal code areas (first 4 digits only)
- Age groups (ranges, not exact ages)
- Theme frequencies (anonymous)
- Improvement metrics (group averages)

**❌ What the dashboard NEVER shows:**
- User names or identifiers
- Conversation content
- Full postal codes
- Individual improvement scores (only aggregates)
- Any personally identifiable information

**Data Retention:**
- Analytics events: Indefinite (anonymous)
- Improvement scores: Linked to anonymous userId hash
- No conversation history stored in dashboard database

---

## 🚀 Deployment

**Current Status:**
- ✅ Running on Manus platform
- ✅ Dev server: `https://3000-irb9k49aupjxdlzwmqcpd-b5c51217.us2.manus.computer`
- ✅ GitHub: `https://github.com/Wim007/matti-opvoedmaatje-analytics`
- ⏳ Production: Ready for publish (click "Publish" in Management UI)

**Environment Variables:**
- `DATABASE_URL` - TiDB/MySQL connection string
- `JWT_SECRET` - Session cookie signing
- `VITE_APP_ID` - Manus OAuth app ID
- `OAUTH_SERVER_URL` - Manus OAuth backend
- `VITE_OAUTH_PORTAL_URL` - Manus login portal

---

## 📦 Integration Requirements

**For Matti/Opvoedmaatje apps to integrate:**

1. **Install Analytics Service**
   - Copy `integration-module/AnalyticsService.ts` to app
   - Install dependency: `@react-native-async-storage/async-storage`

2. **Configure Environment**
   ```env
   ANALYTICS_API_URL=https://your-dashboard.manus.space
   ANALYTICS_API_KEY=<generated_key>
   ANALYTICS_ENABLED=true
   ```

3. **Initialize on App Start**
   ```typescript
   initializeAnalytics({
     apiUrl: process.env.ANALYTICS_API_URL,
     apiKey: process.env.ANALYTICS_API_KEY,
     appName: 'matti',  // or 'opvoedmaatje'
     openAiApiKey: process.env.OPENAI_API_KEY,
     openAiAssistantId: process.env.OPENAI_ASSISTANT_ID,
     enabled: true
   });
   ```

4. **Track Conversations**
   ```typescript
   const analytics = getAnalytics();
   await analytics.trackConversationEnd(
     { threadId, userId, durationMinutes, messageCount },
     { postalCode, birthYear, userType, analyticsConsent: true }
   );
   ```

5. **Track Improvement Scores (Emoji-based)**
   ```typescript
   await analytics.trackThemeScore(
     'pesten',
     '😟',  // Emoji automatically converts to score
     { postalCode, birthYear, userType }
   );
   ```

**See `integration-module/` folder for complete implementation guide.**

---

## 🧪 Testing

**Test Data:**
- `scripts/seed-test-data.ts` - Generates 250 realistic analytics events
- `scripts/seed-funding-data.ts` - Generates improvement scores and referral data

**Run Tests:**
```bash
npm test                    # All tests
npm test analytics          # Analytics router tests
npm test funding            # Funding router tests
npm test pdf                # PDF export tests
```

**Test Coverage:**
- ✅ Analytics event submission (7 tests)
- ✅ Funding metrics calculation (7 tests)
- ✅ PDF generation (7 tests)
- ✅ API key management (auth tests)

---

## 📞 Support

**GitHub Repository:** https://github.com/Wim007/matti-opvoedmaatje-analytics  
**Project:** Thuis Maatjes Platform  
**Dashboard Version:** 1.0.0  
**Last Updated:** January 3, 2026

---

## ✅ Checklist for Integration

- [x] Dashboard code exported to GitHub
- [x] API endpoints documented (REST + tRPC)
- [x] Database schema documented
- [x] Privacy compliance verified (anonymous data only)
- [x] Integration module created (AnalyticsService.ts)
- [x] Test data generators provided
- [x] All tests passing
- [ ] API contract comparison (requires access to API_CONTRACT_DASHBOARD.md)
- [ ] Backend integration with Matti/Opvoedmaatje
- [ ] Production deployment

**Ready for handoff to integration team!** 🚀
