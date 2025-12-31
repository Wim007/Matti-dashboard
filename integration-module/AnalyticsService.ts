/**
 * Analytics Service for Matti & Opvoedmaatje
 * 
 * This module handles:
 * - Theme detection via OpenAI Assistant API
 * - Sending analytics events to the dashboard
 * - Privacy-compliant data collection
 * 
 * @author Analytics Dashboard Team
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AppName = 'matti' | 'opvoedmaatje';
export type UserType = 'jongere' | 'ouder' | 'samengesteld';
export type AgeGroup = '0-12' | '13-15' | '16-18' | '19-25' | '26-35' | '36-45' | '46+';
export type FamilyType = 'tweeling' | 'eenouder' | 'samengesteld' | 'adoptie' | 'pleegzorg';
export type ReferralType = 'jeugd-ggz' | 'wijkteam' | 'huisarts' | 'schuldhulp' | 'veilig-thuis';

export interface AnalyticsConfig {
  apiUrl: string;
  apiKey: string;
  appName: AppName;
  openAiApiKey: string;
  openAiAssistantId: string;
  enabled: boolean;
}

export interface ConversationMetrics {
  threadId: string;
  userId: string;
  durationMinutes: number;
  messageCount: number;
  userRating?: number; // 1-10
  userFeltBetter?: boolean;
}

export interface UserData {
  postalCode?: string;
  birthYear?: number;
  userType: UserType;
  familyType?: FamilyType;
  analyticsConsent: boolean;
}

export interface AnalyticsEvent {
  appName: AppName;
  postalCodeArea: string;
  ageGroup: AgeGroup;
  userType: UserType;
  familyType?: FamilyType;
  themes: string[];
  sessionDuration: number;
  messageCount: number;
  isHighRisk: boolean;
  safetySignal: boolean;
  referralType?: ReferralType;
  daysToReferral?: number;
  satisfactionScore?: number;
  selfReportedImprovement?: boolean;
}

// ============================================================================
// AVAILABLE THEMES
// ============================================================================

export const AVAILABLE_THEMES = [
  'pesten',
  'school',
  'stress',
  'identiteit',
  'relaties',
  'ouders',
  'gezin',
  'toekomst',
  'emoties',
  'vriendschap',
  'zelfvertrouwen',
  'schulden',
  'werk',
  'gezondheid',
  'verslaving',
  'eenzaamheid',
  'rouw',
  'seksualiteit',
  'zwangerschap',
  'huiselijk-geweld'
] as const;

// ============================================================================
// ANALYTICS SERVICE CLASS
// ============================================================================

export class AnalyticsService {
  private config: AnalyticsConfig;
  private openAiBaseUrl = 'https://api.openai.com/v1';

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Main method to call after a conversation ends
   * Handles theme detection and analytics submission
   */
  async trackConversationEnd(
    metrics: ConversationMetrics,
    userData: UserData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if analytics is enabled and user gave consent
      if (!this.config.enabled || !userData.analyticsConsent) {
        console.log('[Analytics] Skipped - disabled or no consent');
        return { success: true }; // Silent skip
      }

      // 1. Detect themes from conversation
      const themes = await this.detectThemes(metrics.threadId);
      console.log('[Analytics] Detected themes:', themes);

      // 2. Detect safety signals
      const safetySignal = await this.detectSafetySignals(metrics.threadId);
      console.log('[Analytics] Safety signal:', safetySignal);

      // 3. Build analytics event
      const event = this.buildAnalyticsEvent(metrics, userData, themes, safetySignal);

      // 4. Send to analytics dashboard
      await this.sendAnalyticsEvent(event);

      console.log('[Analytics] Successfully tracked conversation');
      return { success: true };

    } catch (error) {
      console.error('[Analytics] Error tracking conversation:', error);
      // Fail silently - analytics should never break the app
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Test method to verify analytics connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testEvent: AnalyticsEvent = {
        appName: this.config.appName,
        postalCodeArea: '0000',
        ageGroup: '13-15',
        userType: 'jongere',
        themes: ['test'],
        sessionDuration: 1,
        messageCount: 1,
        isHighRisk: false,
        safetySignal: false,
      };

      await this.sendAnalyticsEvent(testEvent);
      console.log('[Analytics] Test connection successful');
      return true;
    } catch (error) {
      console.error('[Analytics] Test connection failed:', error);
      return false;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS - THEME DETECTION
  // ==========================================================================

  /**
   * Detect themes using OpenAI Assistant API
   */
  private async detectThemes(threadId: string): Promise<string[]> {
    try {
      // Create a message asking for themes
      await this.createMessage(threadId, {
        role: 'user',
        content: `Analyseer ons gesprek en geef een lijst van thema's die we besproken hebben uit deze categorieën: ${AVAILABLE_THEMES.join(', ')}.

Geef alleen de thema's die echt en duidelijk besproken zijn in het gesprek, als JSON array.
Formaat: ["thema1", "thema2"]

Belangrijk: Geef ALLEEN de JSON array terug, geen extra tekst.`
      });

      // Run the assistant
      const run = await this.createRun(threadId);

      // Wait for completion
      await this.waitForRunCompletion(threadId, run.id);

      // Get the response
      const messages = await this.getMessages(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.content[0].type === 'text') {
        const text = lastMessage.content[0].text.value;
        
        // Extract JSON array from response
        const jsonMatch = text.match(/\[.*?\]/s);
        if (jsonMatch) {
          const themes = JSON.parse(jsonMatch[0]);
          return themes.filter((theme: string) => 
            AVAILABLE_THEMES.includes(theme as any)
          );
        }
      }

      return [];
    } catch (error) {
      console.error('[Analytics] Theme detection failed:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Detect safety signals in conversation
   */
  private async detectSafetySignals(threadId: string): Promise<boolean> {
    try {
      // Create a message asking about safety concerns
      await this.createMessage(threadId, {
        role: 'user',
        content: `Bevatte ons gesprek signalen van directe gevaar of crisis zoals:
- Suïcidale gedachten
- Zelfbeschadiging
- Huiselijk geweld
- Acuut gevaar
- Misbruik

Antwoord alleen met "ja" of "nee".`
      });

      // Run the assistant
      const run = await this.createRun(threadId);

      // Wait for completion
      await this.waitForRunCompletion(threadId, run.id);

      // Get the response
      const messages = await this.getMessages(threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.content[0].type === 'text') {
        const text = lastMessage.content[0].text.value.toLowerCase();
        return text.includes('ja');
      }

      return false;
    } catch (error) {
      console.error('[Analytics] Safety signal detection failed:', error);
      return false;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS - OPENAI API
  // ==========================================================================

  private async createMessage(threadId: string, message: { role: string; content: string }) {
    const response = await fetch(
      `${this.openAiBaseUrl}/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify(message)
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async createRun(threadId: string) {
    const response = await fetch(
      `${this.openAiBaseUrl}/threads/${threadId}/runs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: this.config.openAiAssistantId
        })
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getRun(threadId: string, runId: string) {
    const response = await fetch(
      `${this.openAiBaseUrl}/threads/${threadId}/runs/${runId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getMessages(threadId: string) {
    const response = await fetch(
      `${this.openAiBaseUrl}/threads/${threadId}/messages?limit=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async waitForRunCompletion(threadId: string, runId: string, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.getRun(threadId, runId);
      
      if (run.status === 'completed') {
        return run;
      }
      
      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Run timeout - took longer than 30 seconds');
  }

  // ==========================================================================
  // PRIVATE METHODS - ANALYTICS
  // ==========================================================================

  private buildAnalyticsEvent(
    metrics: ConversationMetrics,
    userData: UserData,
    themes: string[],
    safetySignal: boolean
  ): AnalyticsEvent {
    return {
      appName: this.config.appName,
      postalCodeArea: this.anonymizePostalCode(userData.postalCode),
      ageGroup: this.calculateAgeGroup(userData.birthYear),
      userType: userData.userType,
      familyType: userData.familyType,
      themes,
      sessionDuration: metrics.durationMinutes,
      messageCount: metrics.messageCount,
      isHighRisk: themes.length >= 3, // 3+ themes = high risk
      safetySignal,
      satisfactionScore: metrics.userRating,
      selfReportedImprovement: metrics.userFeltBetter,
    };
  }

  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Analytics API error: ${error}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private anonymizePostalCode(postalCode?: string): string {
    if (!postalCode || postalCode.length < 4) {
      return '0000';
    }
    return postalCode.substring(0, 4);
  }

  private calculateAgeGroup(birthYear?: number): AgeGroup {
    if (!birthYear) {
      return '0-12'; // Default fallback
    }

    const age = new Date().getFullYear() - birthYear;

    if (age <= 12) return '0-12';
    if (age <= 15) return '13-15';
    if (age <= 18) return '16-18';
    if (age <= 25) return '19-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    return '46+';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyticsInstance: AnalyticsService | null = null;

export function initializeAnalytics(config: AnalyticsConfig): AnalyticsService {
  analyticsInstance = new AnalyticsService(config);
  return analyticsInstance;
}

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    throw new Error('Analytics not initialized. Call initializeAnalytics() first.');
  }
  return analyticsInstance;
}
