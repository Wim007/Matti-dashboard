# Matti Analytics Implementatie Guide

Complete stap-voor-stap instructies om analytics te integreren in de Matti app.
Kopieer en plak elk commando in de Matti chat.

---

## Stap 1: Installeer Dependencies

```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install && cd ..
```

## Stap 2: Maak Directory

```bash
mkdir -p src/services
```

## Stap 3: Kopieer AnalyticsService.ts

Plaats `AnalyticsService.ts` in `src/services/AnalyticsService.ts`

## Stap 4: Genereer API Key

1. Open Analytics Dashboard
2. Ga naar "API-sleutels"
3. Maak nieuwe key: "Matti Production"
4. Kopieer de key

## Stap 5: Configureer .env

```bash
cat >> .env << 'ENVEOF'
ANALYTICS_API_URL=https://jouw-dashboard.manus.space
ANALYTICS_API_KEY=jouw_api_key_hier
ANALYTICS_ENABLED=true
APP_NAME=matti
ENVEOF
```

## Stap 6: Initialiseer in App.tsx

Voeg toe aan imports:
```typescript
import { initializeAnalytics } from './services/AnalyticsService';
import Config from 'react-native-config';
```

Voeg toe in useEffect:
```typescript
useEffect(() => {
  initializeAnalytics({
    apiUrl: Config.ANALYTICS_API_URL || '',
    apiKey: Config.ANALYTICS_API_KEY || '',
    appName: 'matti',
    openAiApiKey: Config.OPENAI_API_KEY || '',
    openAiAssistantId: Config.OPENAI_ASSISTANT_ID || '',
    enabled: Config.ANALYTICS_ENABLED === 'true'
  });
}, []);
```

## Stap 7: Track Conversations

In ConversationScreen.tsx, voeg toe:

```typescript
import { getAnalytics } from '../services/AnalyticsService';

const handleEndConversation = async () => {
  // Bestaande logica...
  
  // Voeg analytics toe
  if (user?.analyticsConsent) {
    const analytics = getAnalytics();
    analytics.trackConversationEnd(
      {
        threadId: currentThreadId,
        userId: user.id,
        durationMinutes: Math.round((Date.now() - startTime) / 60000),
        messageCount: messages.length,
      },
      {
        postalCode: user.postalCode,
        birthYear: user.birthYear,
        userType: 'jongere',
        analyticsConsent: true
      }
    ).catch(console.error);
  }
};
```

## Stap 8: Test

```bash
npm start
npm run ios
```

Check console voor: `[Matti] Analytics initialized`

## Stap 9: Commit

```bash
git add src/services/AnalyticsService.ts .env App.tsx
git commit -m "feat: Add analytics integration with theme detection"
git push origin main
```

## Verificatie

- [ ] Analytics initialized in console
- [ ] Test connection succesvol
- [ ] Dashboard toont nieuwe events
- [ ] Thema's verschijnen in dashboard

Zie SETUP.md en EXAMPLES.md voor meer details.
