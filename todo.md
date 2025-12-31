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
- [x] Add date range filters for all visualizations

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

## Bug Fixes - TiDB Compatibility
- [x] Replace DATE() with DATE_FORMAT or date truncation in engagement queries
- [x] Test engagement page with new date extraction method

## Bug Fixes - Alternative Date Grouping
- [x] Implement client-side date grouping or use raw timestamp with post-processing
- [x] Test engagement queries with new approach

## Bug Fixes - Server-Side Grouping
- [x] Rewrite getSessionDurationTimeSeries to group data in Node.js
- [x] Rewrite getMessageCountTimeSeries to group data in Node.js
- [x] Test engagement page with server-side grouping

## Date Range Filter Feature
- [x] Create DateRangeFilter component with preset options (7/30/90 dagen, aangepast)
- [x] Integrate react-day-picker for custom date selection
- [x] Add date range state management and URL persistence
- [x] Integrate filter into Dashboard page
- [x] Integrate filter into Demographics page
- [x] Integrate filter into Engagement page
- [x] Integrate filter into Risk Assessment page
- [x] Test date filtering across all visualizations

## Refresh Data Feature
- [x] Add "Ververs Data" button to Engagement page
- [x] Implement tRPC query invalidation on button click
- [x] Add loading state indicator during refresh
- [x] Test refresh functionality

## Theme Frequency Analysis
- [x] Create database query to extract and count themes from analytics events
- [x] Add API endpoint for theme frequency data
- [x] Create bar chart visualization for theme frequency
- [x] Add theme frequency section to Demographics page
- [x] Test theme analysis with sample data
