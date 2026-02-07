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

## Risk Trend Analysis Fix
- [x] Investigate what's missing in Risico Trend Analyse visualization
- [x] Implement missing Risk Trend Analysis chart/visualization
- [x] Test Risk Assessment page to ensure all visualizations work

## Matti/Opvoedmaatje Integration Module
- [x] Create analytics integration module with OpenAI theme detection
- [x] Create configuration and setup documentation
- [x] Create example usage code and testing guide
- [x] Package and deliver complete integration module

## URGENT: Missing API Endpoint
- [x] Create database schema for analytics events table
- [x] Implement POST /api/analytics/event endpoint with API key validation
- [x] Update dashboard queries to use new events table
- [x] Test endpoint with curl and from Matti integration

## Dashboard Optimalisatie voor Funding (Fase 1 - Hoogste Impact)
- [x] Add "Vermeden Zorgkosten" KPI card with cost calculation
- [x] Add "Escalatie Voorkomen" KPI card showing stabilization percentage
- [x] Add "Snelheid Hulp" KPI card comparing app vs traditional care wait times
- [x] Implement improvement tracking: theme_score_start and theme_score_current in database
- [ ] Add "Verbetering na Matti-gesprekken" section to Risk Assessment page
- [x] Replace "Verbeteringspercentage: 0%" with actual improvement data
- [x] Add color coding (green/orange/red) to all KPI cards
- [x] Add info tooltips to all KPIs with calculation method and meaning

## Dashboard Optimalisatie (Fase 2 - UX Improvements)
- [ ] Add "Preventieve Impact per Thema" section to Demographics page
- [ ] Enlarge referral distribution pie chart on Risk Assessment page
- [ ] Add benchmark line to Risk Trend Analysis chart
- [ ] Round all decimals in KPI displays
- [ ] Replace technical terms with user-friendly language
- [ ] Add "Wat betekent dit?" tooltips to all charts

## Dashboard Optimalisatie (Fase 3 - Executive Reporting)
- [ ] Create new "Impact Report" page for executives
- [ ] Add executive summary with monthly overview
- [ ] Add ROI calculation visualization
- [ ] Implement PDF export functionality for presentations
- [ ] Make cost parameters configurable for different municipalities

## Emoji-Based Scoring for Youth Engagement
- [x] Update integration guide with emoji-based scoring system
- [x] Create emoji-to-score mapping configuration
- [x] Add code examples for emoji selection UI in Matti
- [x] Update AnalyticsService.ts to support emoji conversion
- [x] Document backend emoji-to-score conversion logic

## Phase 2 Funding Features (ESSENTIEEL)
- [x] Add "Verbetering per Thema" section to Risk Assessment page with horizontal bar chart
- [x] Show per-theme improvement percentages (pesten, stress, school, etc.)
- [x] Include measurement count per theme
- [x] Create new "Impact Report" page in navigation
- [x] Add executive summary section with key metrics
- [x] Implement ROI calculation visualization (costs vs savings)
- [x] Add PDF export functionality for presentations
- [x] Test Impact Report page and PDF export

## Platform Integration Preparation
- [x] Read API_CONTRACT_DASHBOARD.md from Matti project (not available in this sandbox)
- [x] Read ARCHITECTURE.md from Matti project (not available in this sandbox)
- [x] Document current dashboard API endpoints and response formats
- [x] Document dashboard data structures and visualizations
- [ ] Compare current implementation with API contract (requires access to contract)
- [ ] Identify gaps and required changes (requires contract comparison)
- [x] Create handoff documentation for integration
- [x] Export dashboard code and documentation package

## Dashboard Name Update
- [x] Update dashboard name in DashboardLayout header
- [x] Update page titles and metadata
- [x] Update documentation references
- [x] Test all pages show correct name

## Matti-Specific Dashboard Adaptation (Must-Have Week 1)
- [x] Update branding from "Dashboard voor Matti en Opvoedmaatje" to "Matti Dashboard - Jongeren 12-21 jaar"
- [x] Update description to "Analytics dashboard voor Matti - AI-assistent voor jongeren tussen 12-21 jaar"
- [x] Change age groups from current to: 12-14 jaar, 15-17 jaar, 18-21 jaar
- [x] Remove "Ouder" user type from all visualizations
- [x] Replace "Jongere vs Ouder" chart with "Nieuwe vs Terugkerende gebruikers"
- [x] Replace "Gezinstype Verdeling" with "Wat jongeren over ouders zeggen" chart
- [x] Update seed scripts to generate Matti-only data with new age groups
- [ ] Add data filtering: app_type = 'matti' AND user_age >= 12 AND user_age <= 21
- [ ] Add new "Thema's & Onderwerpen" page to sidebar navigation
- [ ] Implement 9 Matti themes visualization (School, Vrienden, Thuis, Gevoelens, Liefde, Vrije Tijd, Toekomst, Jezelf, Gewoon kletsen)
- [ ] Show per-theme metrics: frequency, average duration, age group distribution
- [ ] Test all pages with Matti-only data filtering

## Phase 3: Data Filtering Implementation
- [x] Update analytics router to filter by app_type='matti'
- [x] Add age range filter (12-21 years) to all queries
- [x] Test all dashboard pages with filtered data
- [x] Verify no Opvoedmaatje data appears in visualizations

## Phase 4: Official Matti Themes Implementation
- [x] Create shared/themes.ts with 9 official Matti themes
- [x] Add sub-themes: Pesten (algemeen), Pesten (online/cyberpesten)
- [x] Create new "Thema's & Onderwerpen" page in navigation
- [x] Implement theme frequency visualization (9 main themes)
- [x] Add per-theme metrics: frequency, average duration, age distribution
- [x] Show sub-theme breakdown for themes with sub-categories
- [x] Test themes page with filtered Matti data

## Phase 5: Enhanced Risk Tracking
- [x] Review current referral tracking implementation
- [x] Add risk escalation prevention metrics
- [x] Implement theme-based risk indicators
- [x] Add safety signal tracking per theme
- [x] Test risk assessment page with enhanced metrics

## Final Enhancements
- [x] Add CSV export button to Themes page
- [x] Implement CSV generation for theme statistics
- [x] Create AgeGroupFilter component (12-14, 15-17, 18-21, Alle)
- [x] Integrate age filter into Dashboard page
- [x] Integrate age filter into Demographics page
- [x] Integrate age filter into Themes page
- [x] Integrate age filter into Engagement page
- [x] Integrate age filter into Risk Assessment page
- [x] Test CSV export functionality
- [x] Test age filtering across all pages

## Pesten Theme & Behavior Change Tracking
- [x] Add "Pesten" as 10th main theme in shared/themes.ts
- [x] Add sub-categories: "Pesten (persoonlijk)" and "Cyberpesten (online)"
- [x] Update MATTI_THEMES array with Pesten theme
- [x] Add Pesten theme color to THEME_COLORS
- [x] Extend analytics_events schema with behavior_change fields
- [x] Add initial_concern and outcome_status columns
- [x] Add actions_completed column for tracking
- [x] Create behavior change queries in server/db-behavior.ts
- [x] Implement getScreenTimeToActionMetrics query
- [x] Implement getBehaviorChangeTimeline query
- [x] Create behavior router with tRPC procedures
- [x] Add "Van Passief naar Actief" section to Impact Report page
- [x] Show screen time → active hobby conversion rate
- [x] Display average intervention duration
- [x] Add ROI calculation for municipalities
- [x] Update seed scripts with Pesten theme data
- [x] Generate behavior change test data (screen time → sport)
- [x] Test Pesten theme visualization
- [x] Test behavior change metrics display

## Cost Avoidance Calculation Update
- [x] Update getCostAvoidance query to include behavior change interventions
- [x] Add behavior change ROI to total cost avoidance calculation
- [x] Test updated cost avoidance display on Dashboard and Impact Report
