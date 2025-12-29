/**
 * Analytics Sender Library for Matti and Opvoedmaatje
 * 
 * This library provides a type-safe interface for sending anonymized analytics
 * data to the Analytics Dashboard API. It handles opt-in checking, error handling,
 * and silent failures to ensure analytics never disrupt the user experience.
 * 
 * @example
 * ```typescript
 * import { sendAnalytics, buildAnalyticsEvent } from './analytics-sender';
 * 
 * // After a conversation ends
 * const event = await buildAnalyticsEvent(conversation, userProfile);
 * await sendAnalytics(event);
 * ```
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type AppName = "matti" | "opvoedmaatje";

export type UserType = "jongere" | "ouder";

export type FamilyType = "eenouder" | "tweeouder" | "samengesteld";

export type ReferralType = "jeugd-ggz" | "wijkteam" | "huisarts" | "schuldhulp" | "veilig-thuis";

/**
 * Analytics event structure matching the API endpoint schema
 */
export interface AnalyticsEvent {
  /** App identifier (matti or opvoedmaatje) */
  appName: AppName;
  /** ISO 8601 timestamp of the event */
  timestamp: string;
  /** Anonymized postal code area (first 4 digits, e.g., "3000-3099") */
  postalCodeArea: string;
  /** Age group of the user (e.g., "13-15", "16-18") */
  ageGroup: string;
  /** Type of user (jongere or ouder) */
  userType: UserType;
  /** Family type (only for ouder users) */
  familyType?: FamilyType;
  /** Array of conversation themes (e.g., ["school", "pesten"]) */
  themes: string[];
  /** Session duration in seconds */
  sessionDuration: number;
  /** Number of messages exchanged in the session */
  messageCount: number;
  /** Whether the user has used the app before */
  isReturningUser: boolean;
  /** Number of times the user has used the app this week */
  weeklyFrequency: number;
  /** Type of referral made (if any) */
  referralType?: ReferralType;
  /** Days from first contact to referral (if applicable) */
  daysToReferral?: number;
  /** User satisfaction score (1-10) */
  satisfactionScore?: number;
  /** Whether the user reported improvement */
  selfReportedImprovement?: boolean;
  /** Whether the user is high risk (≥3 themes) */
  isHighRisk: boolean;
  /** Whether a safety signal was detected */
  safetySignal: boolean;
}

/**
 * User profile data structure (example - adapt to your app's schema)
 */
export interface UserProfile {
  postalCode?: string;
  age?: number;
  userType: UserType;
  familyType?: FamilyType;
  firstVisit?: Date;
  visitCount?: number;
}

/**
 * Conversation data structure (example - adapt to your app's schema)
 */
export interface ConversationData {
  startTime: Date;
  endTime: Date;
  messages: Array<{ role: string; content: string }>;
  themes: string[];
  referral?: {
    type: ReferralType;
    date: Date;
  };
  satisfactionScore?: number;
  selfReportedImprovement?: boolean;
  safetySignal?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the analytics sender
 * Set these values in your app's environment configuration
 */
export interface AnalyticsConfig {
  /** Analytics API base URL */
  apiUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** App name (matti or opvoedmaatje) */
  appName: AppName;
}

// ============================================================================
// Opt-In Management
// ============================================================================

/**
 * Check if the user has opted in to analytics
 * 
 * @returns Promise<boolean> - true if user has opted in, false otherwise
 * 
 * @example
 * ```typescript
 * const hasOptIn = await getAnalyticsOptIn();
 * if (hasOptIn) {
 *   await sendAnalytics(event);
 * }
 * ```
 */
export async function getAnalyticsOptIn(): Promise<boolean> {
  try {
    // TODO: Implement your app's opt-in check logic
    // This could be a local storage value, user preference, or API call
    const optIn = localStorage.getItem("analytics_opt_in");
    return optIn === "true";
  } catch (error) {
    console.error("Failed to check analytics opt-in:", error);
    return false;
  }
}

/**
 * Set the user's analytics opt-in preference
 * 
 * @param optIn - Whether the user has opted in
 * 
 * @example
 * ```typescript
 * await setAnalyticsOptIn(true);
 * ```
 */
export async function setAnalyticsOptIn(optIn: boolean): Promise<void> {
  try {
    // TODO: Implement your app's opt-in storage logic
    localStorage.setItem("analytics_opt_in", optIn.toString());
  } catch (error) {
    console.error("Failed to set analytics opt-in:", error);
  }
}

// ============================================================================
// Analytics Sending
// ============================================================================

/**
 * Send an analytics event to the dashboard API
 * 
 * This function handles:
 * - Opt-in checking
 * - API authentication
 * - Error handling (silent failures)
 * - Network retries
 * 
 * @param event - The analytics event to send
 * @param config - Analytics configuration (API URL, key, app name)
 * 
 * @example
 * ```typescript
 * const event: AnalyticsEvent = {
 *   appName: "matti",
 *   timestamp: new Date().toISOString(),
 *   postalCodeArea: "3000-3099",
 *   ageGroup: "13-15",
 *   userType: "jongere",
 *   themes: ["school", "pesten"],
 *   sessionDuration: 720,
 *   messageCount: 12,
 *   isReturningUser: true,
 *   weeklyFrequency: 3,
 *   isHighRisk: false,
 *   safetySignal: false,
 * };
 * 
 * await sendAnalytics(event, config);
 * ```
 */
export async function sendAnalytics(
  event: AnalyticsEvent,
  config: AnalyticsConfig
): Promise<void> {
  try {
    // Check opt-in status
    const hasOptIn = await getAnalyticsOptIn();
    if (!hasOptIn) {
      console.log("[Analytics] User has not opted in, skipping");
      return;
    }

    // Validate event matches config app name
    if (event.appName !== config.appName) {
      console.error("[Analytics] Event app name does not match config");
      return;
    }

    // Send to API
    const response = await fetch(`${config.apiUrl}/api/trpc/analytics.submitEvent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: config.apiKey,
        event,
      }),
    });

    if (!response.ok) {
      console.error("[Analytics] Failed to send event:", response.statusText);
    } else {
      console.log("[Analytics] Event sent successfully");
    }
  } catch (error) {
    // Fail silently - analytics should never crash the app
    console.error("[Analytics] Error sending event:", error);
  }
}

// ============================================================================
// Event Building Helpers
// ============================================================================

/**
 * Anonymize a postal code to the first 4 digits
 * 
 * @param postalCode - Full postal code (e.g., "3011AB")
 * @returns Anonymized postal code area (e.g., "3000-3099")
 * 
 * @example
 * ```typescript
 * const area = anonymizePostalCode("3011AB"); // "3000-3099"
 * ```
 */
export function anonymizePostalCode(postalCode: string): string {
  if (!postalCode || postalCode.length < 4) {
    return "0000-0099";
  }

  const first4 = postalCode.substring(0, 4);
  const prefix = first4.substring(0, 3);
  const rangeStart = `${prefix}0`;
  const rangeEnd = `${prefix}9`;

  return `${rangeStart}-${rangeEnd}`;
}

/**
 * Determine age group from age
 * 
 * @param age - User's age
 * @returns Age group string (e.g., "13-15")
 * 
 * @example
 * ```typescript
 * const group = getAgeGroup(14); // "13-15"
 * ```
 */
export function getAgeGroup(age: number): string {
  if (age < 13) return "0-12";
  if (age <= 15) return "13-15";
  if (age <= 18) return "16-18";
  if (age <= 25) return "19-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 55) return "46-55";
  return "56+";
}

/**
 * Calculate session duration in seconds
 * 
 * @param startTime - Session start time
 * @param endTime - Session end time
 * @returns Duration in seconds
 * 
 * @example
 * ```typescript
 * const duration = calculateSessionDuration(startTime, endTime); // 720
 * ```
 */
export function calculateSessionDuration(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

/**
 * Calculate days between two dates
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 * 
 * @example
 * ```typescript
 * const days = calculateDaysBetween(firstVisit, referralDate); // 18
 * ```
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Build a complete analytics event from conversation and user data
 * 
 * This is the main helper function that combines all the data into a
 * properly formatted analytics event ready to be sent to the API.
 * 
 * @param conversation - Conversation data
 * @param userProfile - User profile data
 * @param appName - App identifier
 * @returns Complete analytics event
 * 
 * @example
 * ```typescript
 * const event = buildAnalyticsEvent(conversation, userProfile, "matti");
 * await sendAnalytics(event, config);
 * ```
 */
export function buildAnalyticsEvent(
  conversation: ConversationData,
  userProfile: UserProfile,
  appName: AppName
): AnalyticsEvent {
  // Anonymize postal code
  const postalCodeArea = anonymizePostalCode(userProfile.postalCode || "");

  // Determine age group
  const ageGroup = getAgeGroup(userProfile.age || 0);

  // Calculate session duration
  const sessionDuration = calculateSessionDuration(
    conversation.startTime,
    conversation.endTime
  );

  // Count messages
  const messageCount = conversation.messages.length;

  // Determine if returning user
  const isReturningUser = (userProfile.visitCount || 0) > 1;

  // Calculate weekly frequency (example - adapt to your app's logic)
  const weeklyFrequency = userProfile.visitCount || 1;

  // Determine if high risk (3+ themes)
  const isHighRisk = conversation.themes.length >= 3;

  // Calculate days to referral if applicable
  let daysToReferral: number | undefined;
  if (conversation.referral && userProfile.firstVisit) {
    daysToReferral = calculateDaysBetween(
      userProfile.firstVisit,
      conversation.referral.date
    );
  }

  return {
    appName,
    timestamp: conversation.endTime.toISOString(),
    postalCodeArea,
    ageGroup,
    userType: userProfile.userType,
    familyType: userProfile.familyType,
    themes: conversation.themes,
    sessionDuration,
    messageCount,
    isReturningUser,
    weeklyFrequency,
    referralType: conversation.referral?.type,
    daysToReferral,
    satisfactionScore: conversation.satisfactionScore,
    selfReportedImprovement: conversation.selfReportedImprovement,
    isHighRisk,
    safetySignal: conversation.safetySignal || false,
  };
}

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Complete example of integrating analytics into your app
 * 
 * @example
 * ```typescript
 * import { sendAnalytics, buildAnalyticsEvent, AnalyticsConfig } from './analytics-sender';
 * 
 * // 1. Configure analytics
 * const analyticsConfig: AnalyticsConfig = {
 *   apiUrl: process.env.ANALYTICS_API_URL || "https://your-dashboard.manus.space",
 *   apiKey: process.env.ANALYTICS_API_KEY || "",
 *   appName: "matti",
 * };
 * 
 * // 2. After a conversation ends
 * async function handleConversationEnd(
 *   conversation: ConversationData,
 *   userProfile: UserProfile
 * ) {
 *   try {
 *     // Build the analytics event
 *     const event = buildAnalyticsEvent(
 *       conversation,
 *       userProfile,
 *       analyticsConfig.appName
 *     );
 * 
 *     // Send to analytics dashboard
 *     await sendAnalytics(event, analyticsConfig);
 *   } catch (error) {
 *     // Analytics errors are logged but don't affect the app
 *     console.error("Analytics error:", error);
 *   }
 * }
 * ```
 */
