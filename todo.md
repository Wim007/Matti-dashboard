# Analytics Dashboard TODO

## Database & Schema
- [x] Design analytics events table with all required fields
- [x] Create API keys table for authentication
- [x] Implement database migrations

## API Development
- [x] Build POST /api/analytics/event endpoint
- [x] Implement X-API-Key header validation
- [x] Add request validation with Zod schemas
- [x] Implement error handling and logging
- [x] Create API key management procedures

## Dashboard UI
- [x] Set up admin authentication with role-based access
- [x] Create dashboard layout with navigation
- [x] Build user demographics visualization (age groups, postal codes)
- [x] Implement theme frequency analysis (bar and pie charts)
- [x] Create referral tracking dashboard with time-to-referral metrics
- [x] Build risk assessment metrics panel (high-risk users, safety signals)
- [x] Add time-series charts (session duration, message counts, weekly frequency)
- [x] Implement user engagement metrics (returning users, satisfaction, improvement)
- [ ] Add date range filters for all visualizations

## Client Library
- [x] Create TypeScript analytics-sender.ts with type-safe interfaces
- [x] Implement opt-in handling
- [x] Add silent error handling
- [x] Create buildAnalyticsEvent helper function
- [x] Write integration documentation

## Testing & Delivery
- [x] Write vitest tests for API endpoints
- [x] Test API integration with sample data
- [x] Verify all visualizations render correctly
- [x] Create checkpoint and deliver application

## Bug Fixes
- [x] Fix SQL DATE() function compatibility in time-series queries
- [x] Fix DATE_FORMAT query to use proper date truncation for TiDB compatibility
- [x] Fix CAST AS DATE query using DATE() function or alternative date truncation method

## Localization
- [x] Translate all dashboard pages to Dutch
- [x] Translate navigation menu to Dutch
- [x] Translate API Keys page to Dutch
- [x] Translate error messages and notifications to Dutch

## Test Data Generator
- [x] Design realistic data distributions (age groups, postal codes, themes)
- [x] Create seed script to generate 200+ analytics events
- [x] Implement temporal patterns (varied timestamps over 30 days)
- [x] Add varied user behaviors (returning users, referrals, satisfaction scores)
- [x] Test generator and verify dashboard displays data correctly
- [x] Fix TypeError in Dashboard component for returningUserRate.toFixed

## Bug Fixes - TypeError on Pages
- [x] Fix TypeError on Engagement page (avgMessageCount.toFixed)
- [x] Fix TypeError on Demographics page (if any)
- [x] Fix TypeError on RiskAssessment page (if any)
- [x] Test all pages to ensure no remaining toFixed errors

## Bug Fixes - Engagement Page SQL Queries
- [x] Fix DATE() function in sessionDuration query
- [x] Fix DATE() function in messageCount query
- [x] Test engagement page visualizations
