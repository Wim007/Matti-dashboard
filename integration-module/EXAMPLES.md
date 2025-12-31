# Analytics Integration - Code Voorbeelden

Praktische code voorbeelden voor verschillende scenario's in Matti en Opvoedmaatje.

---

## 📱 Basis Implementatie

### Voorbeeld 1: Simpele Integratie

```typescript
// App.tsx - Initialisatie bij app start
import React, { useEffect } from 'react';
import { initializeAnalytics } from './services/AnalyticsService';
import Config from 'react-native-config';

export default function App() {
  useEffect(() => {
    // Initialiseer analytics
    initializeAnalytics({
      apiUrl: Config.ANALYTICS_API_URL,
      apiKey: Config.ANALYTICS_API_KEY,
      appName: 'matti', // of 'opvoedmaatje'
      openAiApiKey: Config.OPENAI_API_KEY,
      openAiAssistantId: Config.OPENAI_ASSISTANT_ID,
      enabled: true
    });
  }, []);

  return <NavigationContainer>{/* ... */}</NavigationContainer>;
}
```

### Voorbeeld 2: Met Custom Hook

```typescript
// hooks/useAnalytics.ts
import { useCallback } from 'react';
import { getAnalytics } from '../services/AnalyticsService';
import { useUser } from './useUser';

export function useAnalytics() {
  const { user } = useUser();

  const trackConversation = useCallback(async (conversationData) => {
    if (!user?.analyticsConsent) {
      return { success: true }; // Skip silently
    }

    try {
      const analytics = getAnalytics();
      return await analytics.trackConversationEnd(
        {
          threadId: conversationData.threadId,
          userId: user.id,
          durationMinutes: Math.round(conversationData.durationMs / 60000),
          messageCount: conversationData.messages.length,
          userRating: conversationData.rating,
          userFeltBetter: conversationData.feltBetter
        },
        {
          postalCode: user.postalCode,
          birthYear: user.birthYear,
          userType: user.type,
          familyType: user.familyType,
          analyticsConsent: user.analyticsConsent
        }
      );
    } catch (error) {
      console.error('Analytics error:', error);
      return { success: false, error };
    }
  }, [user]);

  return { trackConversation };
}
```

---

## 💬 Conversation Tracking

### Voorbeeld 3: Bij Conversation End Button

```typescript
// screens/ConversationScreen.tsx
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { useAnalytics } from '../hooks/useAnalytics';

export function ConversationScreen({ route }) {
  const { threadId } = route.params;
  const { trackConversation } = useAnalytics();
  const [isEnding, setIsEnding] = useState(false);

  const handleEndConversation = async () => {
    setIsEnding(true);

    try {
      // 1. Bereken conversation metrics
      const conversationData = {
        threadId,
        durationMs: Date.now() - conversationStartTime,
        messages: conversationMessages,
        rating: undefined, // Wordt later gevraagd
        feltBetter: undefined
      };

      // 2. Sla lokaal op
      await saveConversationLocally(conversationData);

      // 3. Vraag feedback (optioneel)
      const feedback = await showFeedbackDialog();
      conversationData.rating = feedback.rating;
      conversationData.feltBetter = feedback.feltBetter;

      // 4. Track analytics (fire-and-forget)
      trackConversation(conversationData).catch(console.error);

      // 5. Navigeer terug
      navigation.goBack();

    } catch (error) {
      Alert.alert('Error', 'Could not end conversation');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <View>
      {/* Chat UI */}
      <Button 
        title="Gesprek Beëindigen" 
        onPress={handleEndConversation}
        disabled={isEnding}
      />
    </View>
  );
}
```

### Voorbeeld 4: Met Feedback Dialog

```typescript
// components/FeedbackDialog.tsx
import React, { useState } from 'react';
import { Modal, View, Text, Button } from 'react-native';

interface FeedbackDialogProps {
  visible: boolean;
  onSubmit: (feedback: { rating: number; feltBetter: boolean }) => void;
  onSkip: () => void;
}

export function FeedbackDialog({ visible, onSubmit, onSkip }: FeedbackDialogProps) {
  const [rating, setRating] = useState(5);
  const [feltBetter, setFeltBetter] = useState<boolean | undefined>();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Hoe vond je dit gesprek?</Text>

          {/* Rating 1-10 */}
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <Button
                key={num}
                title={String(num)}
                onPress={() => setRating(num)}
                color={rating === num ? '#007AFF' : '#999'}
              />
            ))}
          </View>

          {/* Felt Better */}
          <Text style={styles.question}>
            Voel je je beter na dit gesprek?
          </Text>
          <View style={styles.buttonRow}>
            <Button 
              title="Ja" 
              onPress={() => setFeltBetter(true)}
              color={feltBetter === true ? '#34C759' : '#999'}
            />
            <Button 
              title="Nee" 
              onPress={() => setFeltBetter(false)}
              color={feltBetter === false ? '#FF3B30' : '#999'}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title="Overslaan" onPress={onSkip} />
            <Button 
              title="Verzenden" 
              onPress={() => onSubmit({ rating, feltBetter: feltBetter ?? false })}
              disabled={feltBetter === undefined}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Gebruik in ConversationScreen
const showFeedbackDialog = (): Promise<{ rating: number; feltBetter: boolean }> => {
  return new Promise((resolve) => {
    setFeedbackVisible(true);
    setFeedbackCallback(() => (feedback) => {
      setFeedbackVisible(false);
      resolve(feedback);
    });
  });
};
```

---

## 🔒 Privacy & Consent

### Voorbeeld 5: Onboarding met Consent

```typescript
// screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch, Button } from 'react-native';

export function OnboardingScreen() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [step, setStep] = useState(1);

  const handleComplete = async () => {
    // Sla user data op met consent
    await createUser({
      // ... andere user data
      analyticsConsent
    });

    navigation.navigate('Home');
  };

  if (step === 3) { // Analytics consent stap
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Help ons Matti te verbeteren</Text>
        
        <Text style={styles.description}>
          We willen Matti graag beter maken voor jou en andere jongeren.
          Hiervoor verzamelen we geanonimiseerde gegevens over hoe de app
          gebruikt wordt.
        </Text>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>Wat we NIET verzamelen:</Text>
          <Text style={styles.privacyItem}>• Je naam</Text>
          <Text style={styles.privacyItem}>• Je exacte locatie</Text>
          <Text style={styles.privacyItem}>• De inhoud van je gesprekken</Text>
          <Text style={styles.privacyItem}>• Persoonlijke informatie</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>Wat we WEL verzamelen:</Text>
          <Text style={styles.privacyItem}>• Welke onderwerpen besproken worden</Text>
          <Text style={styles.privacyItem}>• Hoe lang gesprekken duren</Text>
          <Text style={styles.privacyItem}>• Je leeftijdsgroep (bijv. 13-15)</Text>
          <Text style={styles.privacyItem}>• Je regio (eerste 4 cijfers postcode)</Text>
        </View>

        <View style={styles.consentRow}>
          <Switch 
            value={analyticsConsent} 
            onValueChange={setAnalyticsConsent}
          />
          <Text style={styles.consentText}>
            Ik geef toestemming voor geanonimiseerde analytics
          </Text>
        </View>

        <Text style={styles.note}>
          Je kunt dit later altijd wijzigen in de instellingen
        </Text>

        <Button title="Doorgaan" onPress={handleComplete} />
      </View>
    );
  }

  return null; // Andere onboarding stappen
}
```

### Voorbeeld 6: Settings met Consent Toggle

```typescript
// screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useUser } from '../hooks/useUser';

export function SettingsScreen() {
  const { user, updateUser } = useUser();

  const handleToggleAnalytics = async (enabled: boolean) => {
    if (!enabled) {
      // Waarschuwing bij uitschakelen
      Alert.alert(
        'Analytics uitschakelen?',
        'We zullen geen analytics meer verzamelen. Dit helpt ons minder om Matti te verbeteren.',
        [
          { text: 'Annuleren', style: 'cancel' },
          {
            text: 'Uitschakelen',
            style: 'destructive',
            onPress: async () => {
              await updateUser({ analyticsConsent: false });
            }
          }
        ]
      );
    } else {
      await updateUser({ analyticsConsent: true });
      Alert.alert(
        'Bedankt!',
        'Je helpt ons Matti te verbeteren voor jou en andere jongeren.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Privacy & Data</Text>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Analytics</Text>
          <Text style={styles.settingDescription}>
            Help ons Matti te verbeteren door geanonimiseerde gebruiksgegevens te delen
          </Text>
        </View>
        <Switch 
          value={user.analyticsConsent} 
          onValueChange={handleToggleAnalytics}
        />
      </View>

      <Button 
        title="Meer info over privacy" 
        onPress={() => navigation.navigate('Privacy')}
      />
    </View>
  );
}
```

---

## 🧪 Testing & Debugging

### Voorbeeld 7: Test Connection Component

```typescript
// screens/DevToolsScreen.tsx (alleen in development)
import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { getAnalytics } from '../services/AnalyticsService';

export function DevToolsScreen() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setTesting(true);
    setResult('Testing...');

    try {
      const analytics = getAnalytics();
      const success = await analytics.testConnection();

      if (success) {
        setResult('✅ Analytics connection successful!\nCheck dashboard for test event.');
      } else {
        setResult('❌ Analytics connection failed.\nCheck API key and URL.');
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const sendTestEvent = async () => {
    setTesting(true);
    setResult('Sending test event...');

    try {
      const analytics = getAnalytics();
      const result = await analytics.trackConversationEnd(
        {
          threadId: 'test_thread_' + Date.now(),
          userId: 'test_user',
          durationMinutes: 15,
          messageCount: 10,
          userRating: 8,
          userFeltBetter: true
        },
        {
          postalCode: '1234AB',
          birthYear: 2008,
          userType: 'jongere',
          analyticsConsent: true
        }
      );

      if (result.success) {
        setResult('✅ Test event sent!\nThemes detected: Check logs\nView in dashboard');
      } else {
        setResult(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (!__DEV__) {
    return null; // Alleen in development
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics Dev Tools</Text>

      <Button 
        title="Test Connection" 
        onPress={testConnection}
        disabled={testing}
      />

      <Button 
        title="Send Test Event" 
        onPress={sendTestEvent}
        disabled={testing}
      />

      {testing && <ActivityIndicator />}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </View>
  );
}
```

### Voorbeeld 8: Logging & Debugging

```typescript
// services/AnalyticsLogger.ts
class AnalyticsLogger {
  private logs: string[] = [];

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    this.logs.push(logEntry);
    
    if (__DEV__) {
      console.log('[Analytics]', message, data || '');
    }

    // Optioneel: stuur naar remote logging service
    if (data?.error) {
      this.reportError(message, data.error);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  private reportError(message: string, error: Error) {
    // Integreer met je error tracking (Sentry, etc.)
    // Sentry.captureException(error, { extra: { message } });
  }
}

export const analyticsLogger = new AnalyticsLogger();

// Gebruik in AnalyticsService
private async detectThemes(threadId: string): Promise<string[]> {
  analyticsLogger.log('Starting theme detection', { threadId });
  
  try {
    const themes = await this.performThemeDetection(threadId);
    analyticsLogger.log('Theme detection successful', { threadId, themes });
    return themes;
  } catch (error) {
    analyticsLogger.log('Theme detection failed', { threadId, error });
    throw error;
  }
}
```

---

## 🎯 Advanced Use Cases

### Voorbeeld 9: Batch Analytics (meerdere gesprekken)

```typescript
// services/AnalyticsBatchService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics } from './AnalyticsService';

const BATCH_KEY = '@analytics_batch';
const BATCH_SIZE = 10;

export async function queueAnalyticsEvent(conversationData, userData) {
  // Voeg toe aan queue
  const batch = await AsyncStorage.getItem(BATCH_KEY);
  const queue = batch ? JSON.parse(batch) : [];
  
  queue.push({ conversationData, userData, timestamp: Date.now() });
  
  await AsyncStorage.setItem(BATCH_KEY, JSON.stringify(queue));

  // Als queue vol is, verzend batch
  if (queue.length >= BATCH_SIZE) {
    await processBatch();
  }
}

async function processBatch() {
  const batch = await AsyncStorage.getItem(BATCH_KEY);
  if (!batch) return;

  const queue = JSON.parse(batch);
  const analytics = getAnalytics();

  // Verzend alle events
  for (const item of queue) {
    try {
      await analytics.trackConversationEnd(
        item.conversationData,
        item.userData
      );
    } catch (error) {
      console.error('Batch item failed:', error);
      // Continue met volgende items
    }
  }

  // Clear queue
  await AsyncStorage.removeItem(BATCH_KEY);
}

// Roep aan bij app start
export async function processPendingAnalytics() {
  await processBatch();
}
```

### Voorbeeld 10: Offline Support

```typescript
// services/AnalyticsOfflineQueue.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = '@analytics_offline_queue';

export class AnalyticsOfflineQueue {
  private isOnline = true;

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      
      if (this.isOnline) {
        this.processOfflineQueue();
      }
    });
  }

  async addToQueue(conversationData, userData) {
    const queue = await this.getQueue();
    queue.push({ conversationData, userData, timestamp: Date.now() });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  async processOfflineQueue() {
    if (!this.isOnline) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline analytics events`);

    const analytics = getAnalytics();
    const failed = [];

    for (const item of queue) {
      try {
        await analytics.trackConversationEnd(
          item.conversationData,
          item.userData
        );
      } catch (error) {
        console.error('Failed to process offline item:', error);
        failed.push(item);
      }
    }

    // Bewaar alleen de failed items
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
  }

  private async getQueue() {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

// Gebruik
const offlineQueue = new AnalyticsOfflineQueue();

// In je conversation handler
if (!isOnline) {
  await offlineQueue.addToQueue(conversationData, userData);
} else {
  await analytics.trackConversationEnd(conversationData, userData);
}
```

---

## 📊 Dashboard Integration

### Voorbeeld 11: In-App Dashboard Preview

```typescript
// screens/AnalyticsDashboardScreen.tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import Config from 'react-native-config';

export function AnalyticsDashboardScreen() {
  // Alleen voor admins/developers
  const dashboardUrl = Config.ANALYTICS_DASHBOARD_URL;

  return (
    <WebView 
      source={{ uri: dashboardUrl }}
      style={{ flex: 1 }}
    />
  );
}
```

---

**Meer voorbeelden nodig?** Neem contact op met het development team!
