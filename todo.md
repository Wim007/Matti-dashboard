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
