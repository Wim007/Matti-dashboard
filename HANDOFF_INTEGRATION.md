# Analytics Dashboard - Integration Handoff Document

**From:** Analytics Dashboard Team  
**To:** Platform Integration Team  
**Date:** January 3, 2026  
**Project:** Thuis Maatjes Platform Integration

---

## 🎯 Purpose

This document provides everything needed to integrate the Analytics Dashboard with Matti and Opvoedmaatje apps into a unified **Thuis Maatjes Platform**.

---

## 📦 What's Included

### 1. **Complete Dashboard Code**
- **GitHub:** https://github.com/Wim007/matti-opvoedmaatje-analytics
- **Branch:** `main`
- **Latest Commit:** c9d85670
- **Status:** Production-ready, all tests passing

### 2. **Documentation**
- `DASHBOARD_API_DOCUMENTATION.md` - Complete API reference
- `integration-module/` - Ready-to-use AnalyticsService for mobile apps
- `integration-module/EMOJI-SCORING-GUIDE.md` - Emoji-based scoring implementation
- `integration-module/MATTI-QUICK-START.md` - Step-by-step integration guide

### 3. **Test Data & Scripts**
- `scripts/seed-test-data.ts` - Generate 250 realistic analytics events
- `scripts/seed-funding-data.ts` - Generate improvement scores and referral tracking
- All tests passing (21 tests total)

---

## 🏗️ Current Architecture

```
┌─────────────────┐
│  Matti App      │ (Youth, 12-21 years)
│  (React Native) │
└────────┬────────┘
         │
         │ POST /api/analytics/event
         │ (Anonymous data)
         ▼
┌─────────────────────────────┐
│  Analytics Dashboard        │
│  (React + tRPC + Express)   │
│  - Receives events          │
│  - Stores in TiDB           │
│  - Shows aggregated stats   │
│  - Generates reports        │
└─────────────────────────────┘
         ▲
         │ POST /api/analytics/event
         │ (Anonymous data)
         │
┌────────┴────────┐
│ Opvoedmaatje    │ (Parents)
│ (React Native)  │
└─────────────────┘
```

---

## 🔌 Integration Points

### **Data Flow:**
1. User interacts with Matti/Opvoedmaatje
2. App detects conversation end or improvement score
3. App calls `analytics.trackConversationEnd()` or `analytics.trackThemeScore()`
4. AnalyticsService sends POST to `/api/analytics/event`
5. Dashboard validates API key, stores event in database
6. Dashboard aggregates data for visualizations
7. Municipality/insurer views statistics in dashboard

### **Authentication:**
- **Mobile Apps → Dashboard:** API key in `X-API-Key` header
- **Admin → Dashboard:** Manus OAuth (already configured)

### **Privacy:**
- All data is anonymous (no names, no conversation content)
- Postal codes truncated to 4 digits
- User IDs are hashed
- Only aggregated statistics shown

---

## 📋 Integration Checklist

### **Phase 1: Dashboard Setup** ✅
- [x] Dashboard code complete
- [x] API endpoints implemented
- [x] Database schema created
- [x] Tests passing
- [x] Documentation written
- [x] GitHub repository created

### **Phase 2: Mobile App Integration** (TODO)
- [ ] Copy `AnalyticsService.ts` to Matti app
- [ ] Install `@react-native-async-storage/async-storage`
- [ ] Configure environment variables (API URL + Key)
- [ ] Initialize analytics on app start
- [ ] Track conversation end events
- [ ] Implement emoji scoring UI
- [ ] Track theme improvement scores
- [ ] Test with dashboard (verify events appear)

### **Phase 3: Opvoedmaatje Integration** (TODO)
- [ ] Copy `AnalyticsService.ts` to Opvoedmaatje app
- [ ] Same steps as Matti
- [ ] Test both apps sending to same dashboard

### **Phase 4: Production Deployment** (TODO)
- [ ] Publish dashboard (click "Publish" in Manus UI)
- [ ] Configure custom domain (optional)
- [ ] Update mobile apps with production API URL
- [ ] Monitor first real events
- [ ] Verify privacy compliance

---

## 🚀 Quick Start for Integration Team

### **Step 1: Clone Dashboard**
```bash
git clone https://github.com/Wim007/matti-opvoedmaatje-analytics.git
cd matti-opvoedmaatje-analytics
pnpm install
```

### **Step 2: Review Documentation**
```bash
# Read these files in order:
1. DASHBOARD_API_DOCUMENTATION.md  # API reference
2. integration-module/MATTI-QUICK-START.md  # Mobile integration guide
3. integration-module/EMOJI-SCORING-GUIDE.md  # Scoring system
```

### **Step 3: Generate Test Data**
```bash
pnpm tsx scripts/seed-test-data.ts
pnpm tsx scripts/seed-funding-data.ts
```

### **Step 4: Explore Dashboard**
```bash
pnpm dev
# Open http://localhost:3000
# Login with Manus OAuth
# Explore all pages (Overzicht, Demografie, Betrokkenheid, etc.)
```

### **Step 5: Test API**
```bash
# Generate API key in dashboard UI (API-sleutels page)
# Test event submission:
curl -X POST http://localhost:3000/api/analytics/event \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "matti",
    "postalCodeArea": "1234",
    "ageGroup": "13-15",
    "userType": "jongere",
    "themes": ["school", "stress"],
    "sessionDuration": 15,
    "messageCount": 8,
    "isHighRisk": false,
    "safetySignal": false
  }'
```

---

## 📊 Expected Data Format

### **From Matti App:**
```json
{
  "appName": "matti",
  "postalCodeArea": "1234",
  "ageGroup": "13-15",
  "userType": "jongere",
  "themes": ["pesten", "school", "vrienden"],
  "sessionDuration": 12,
  "messageCount": 6,
  "isHighRisk": false,
  "safetySignal": false,
  "satisfactionScore": 8,
  "selfReportedImprovement": true
}
```

### **From Opvoedmaatje App:**
```json
{
  "appName": "opvoedmaatje",
  "postalCodeArea": "5678",
  "ageGroup": "36-45",
  "userType": "ouder",
  "familyType": "eenouder",
  "themes": ["opvoeding", "grenzen", "communicatie"],
  "sessionDuration": 18,
  "messageCount": 10,
  "isHighRisk": false,
  "safetySignal": false,
  "satisfactionScore": 9
}
```

---

## 🔍 What to Check in API_CONTRACT_DASHBOARD.md

When you have access to the API contract document, compare:

1. **Endpoint URLs** - Do they match `/api/analytics/event`?
2. **Request Schema** - Does the contract expect the same fields?
3. **Response Format** - Is `{ success: boolean, eventId: number }` correct?
4. **Theme Names** - Are theme strings consistent? (pesten, school, stress, etc.)
5. **Age Groups** - Do age group ranges match?
6. **Privacy Rules** - Are we compliant with anonymization requirements?

**If there are differences:**
- Document them in a new file: `INTEGRATION_GAPS.md`
- Decide whether to adapt dashboard or contract
- Update accordingly

---

## 🛠️ Technical Details

### **Tech Stack:**
- **Frontend:** React 19 + TypeScript + Tailwind 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11
- **Database:** TiDB (MySQL-compatible)
- **Auth:** Manus OAuth 2.0
- **Charts:** Recharts
- **PDF:** Puppeteer (server-side rendering)

### **Key Dependencies:**
```json
{
  "@trpc/server": "^11.0.0",
  "@trpc/client": "^11.0.0",
  "drizzle-orm": "^0.38.3",
  "express": "^4.21.2",
  "react": "^19.0.0",
  "recharts": "^2.15.0",
  "zod": "^3.24.1"
}
```

### **Database Tables:**
- `analyticsEvents` - Main event storage
- `improvementScores` - Theme improvement tracking
- `referralTracking` - Prevented care tracking
- `costConfig` - Configurable cost parameters
- `apiKeys` - API key management
- `user` - Admin users (OAuth)

---

## 📈 Success Metrics

**After integration, you should see:**
- ✅ Events appearing in dashboard within seconds of mobile app submission
- ✅ All visualizations updating with real data
- ✅ KPIs calculating correctly (costs saved, improvement rates, ROI)
- ✅ No privacy violations (no personal data visible)
- ✅ PDF exports working for Impact Reports

**Test with:**
- 10-20 test events from Matti
- 10-20 test events from Opvoedmaatje
- Verify all dashboard pages show data
- Generate and review PDF report

---

## 🚨 Common Issues & Solutions

### **Issue: Events not appearing in dashboard**
- Check API key is correct
- Verify `X-API-Key` header is set
- Check network connectivity
- Look at server logs for errors
- Verify database connection

### **Issue: Theme names don't match**
- Compare theme strings in mobile app vs dashboard
- Update `THEME_LIST` constant if needed
- Ensure consistency across all apps

### **Issue: Postal code validation fails**
- Ensure postal code is exactly 4 digits
- Remove spaces and letters
- Handle edge cases (unknown postal codes)

### **Issue: Age group calculation wrong**
- Verify `calculateAgeGroup()` logic
- Check birth year format
- Handle edge cases (very young/old users)

---

## 📞 Contact & Support

**Dashboard Team:**
- GitHub: https://github.com/Wim007/matti-opvoedmaatje-analytics
- All code is open source and documented

**Integration Questions:**
- Review `DASHBOARD_API_DOCUMENTATION.md` first
- Check `integration-module/` examples
- Create GitHub issue if needed

---

## ✅ Final Checklist

**Before starting integration:**
- [ ] Read `DASHBOARD_API_DOCUMENTATION.md`
- [ ] Clone GitHub repository
- [ ] Run dashboard locally
- [ ] Generate test data
- [ ] Explore all dashboard pages
- [ ] Review `integration-module/` code
- [ ] Compare with `API_CONTRACT_DASHBOARD.md` (if available)

**During integration:**
- [ ] Copy AnalyticsService to mobile apps
- [ ] Configure environment variables
- [ ] Implement conversation tracking
- [ ] Implement emoji scoring UI
- [ ] Test with mock data first
- [ ] Test with real conversations
- [ ] Verify dashboard shows data

**After integration:**
- [ ] Deploy dashboard to production
- [ ] Update mobile apps with production URL
- [ ] Monitor first real events
- [ ] Verify privacy compliance
- [ ] Generate first Impact Report
- [ ] Share with stakeholders

---

## 🎉 Ready for Integration!

**Everything you need is in this repository:**
- ✅ Complete dashboard code
- ✅ API documentation
- ✅ Integration module
- ✅ Test scripts
- ✅ Examples and guides

**Next Steps:**
1. Review all documentation
2. Compare with API contract (if available)
3. Start mobile app integration
4. Test thoroughly
5. Deploy to production

**Good luck! 🚀**

---

**Last Updated:** January 3, 2026  
**Dashboard Version:** 1.0.0  
**Status:** Ready for Integration ✅
