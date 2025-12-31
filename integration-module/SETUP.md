# Analytics Integration Setup Guide

Complete setup guide voor integratie van analytics in Matti en Opvoedmaatje apps.

---

## 📋 Vereisten

- React Native app (iOS/Android)
- OpenAI Assistant API al geïmplementeerd
- `@react-native-async-storage/async-storage` geïnstalleerd
- Node.js 16+ voor development

---

## 🚀 Installatie Stappen

### Stap 1: Kopieer Bestanden

Kopieer `AnalyticsService.ts` naar je project:

```bash
# In je Matti/Opvoedmaatje project
mkdir -p src/services
cp AnalyticsService.ts src/services/
```

### Stap 2: Installeer Dependencies

```bash
# Als je AsyncStorage nog niet hebt
npm install @react-native-async-storage/async-storage

# Of met yarn
yarn add @react-native-async-storage/async-storage
```

### Stap 3: Genereer API Keys

1. Open het Analytics Dashboard: https://jouw-dashboard-url.manus.space
2. Log in als admin
3. Ga naar "API-sleutels" pagina
4. Klik "Nieuwe API-sleutel"
5. Vul in:
   - **Naam**: "Matti Production" (of "Opvoedmaatje Production")
   - **Beschrijving**: "Analytics tracking voor Matti app"
6. Kopieer de gegenereerde API key (wordt maar 1x getoond!)
7. Bewaar veilig in je environment variabelen

### Stap 4: Configureer Environment Variables

Voeg toe aan je `.env` bestand:

```env
# Analytics Dashboard
ANALYTICS_API_URL=https://jouw-dashboard-url.manus.space
ANALYTICS_API_KEY=jouw_gegenereerde_api_key_hier

# OpenAI (bestaande configuratie)
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# App configuratie
APP_NAME=matti  # of 'opvoedmaatje'
ANALYTICS_ENABLED=true
```

### Stap 5: Initialiseer Analytics Service

In je app's entry point (bijv. `App.tsx` of `index.js`):

```typescript
import { initializeAnalytics } from './services/AnalyticsService';
import Config from 'react-native-config'; // of je eigen env manager

// Bij app start
initializeAnalytics({
  apiUrl: Config.ANALYTICS_API_URL,
  apiKey: Config.ANALYTICS_API_KEY,
  appName: Config.APP_NAME as 'matti' | 'opvoedmaatje',
  openAiApiKey: Config.OPENAI_API_KEY,
  openAiAssistantId: Config.OPENAI_ASSISTANT_ID,
  enabled: Config.ANALYTICS_ENABLED === 'true'
});
```

---

## 🔧 Integratie in Bestaande Code

### Optie A: Bij Conversation End Event

Als je al een handler hebt voor wanneer een gesprek eindigt:

```typescript
import { getAnalytics } from './services/AnalyticsService';

async function handleConversationEnd(conversationData) {
  // Je bestaande logica
  await saveConversationLocally(conversationData);
  
  // Voeg analytics toe
  try {
    const analytics = getAnalytics();
    
    await analytics.trackConversationEnd(
      {
        threadId: conversationData.threadId,
        userId: conversationData.userId,
        durationMinutes: conversationData.duration,
        messageCount: conversationData.messages.length,
        userRating: conversationData.rating, // optioneel
        userFeltBetter: conversationData.feltBetter // optioneel
      },
      {
        postalCode: currentUser.postalCode,
        birthYear: currentUser.birthYear,
        userType: currentUser.type, // 'jongere' of 'ouder'
        familyType: currentUser.familyType, // optioneel
        analyticsConsent: currentUser.analyticsConsent
      }
    );
  } catch (error) {
    // Analytics mag nooit de app breken
    console.error('Analytics error:', error);
  }
}
```

### Optie B: Als Context/Hook

Maak een custom hook voor gemakkelijk gebruik:

```typescript
// hooks/useAnalytics.ts
import { getAnalytics } from '../services/AnalyticsService';
import { useUser } from './useUser'; // je bestaande user hook

export function useAnalytics() {
  const { user } = useUser();
  const analytics = getAnalytics();

  const trackConversation = async (conversationData) => {
    if (!user.analyticsConsent) {
      console.log('Analytics: User has not given consent');
      return;
    }

    return analytics.trackConversationEnd(
      {
        threadId: conversationData.threadId,
        userId: user.id,
        durationMinutes: conversationData.duration,
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
  };

  return { trackConversation };
}

// Gebruik in component
function ConversationScreen() {
  const { trackConversation } = useAnalytics();

  const handleEndConversation = async () => {
    // ... je logica
    await trackConversation(conversationData);
  };

  return (
    <Button onPress={handleEndConversation}>
      Gesprek Beëindigen
    </Button>
  );
}
```

---

## 🧪 Testen

### Test 1: Verbinding Testen

```typescript
import { getAnalytics } from './services/AnalyticsService';

async function testAnalyticsConnection() {
  const analytics = getAnalytics();
  const success = await analytics.testConnection();
  
  if (success) {
    console.log('✅ Analytics verbinding werkt!');
  } else {
    console.log('❌ Analytics verbinding mislukt');
  }
}

// Roep aan bij app start (development only)
if (__DEV__) {
  testAnalyticsConnection();
}
```

### Test 2: Volledige Flow Testen

```typescript
async function testFullAnalyticsFlow() {
  const analytics = getAnalytics();
  
  const testMetrics = {
    threadId: 'thread_test_123',
    userId: 'user_test_456',
    durationMinutes: 15,
    messageCount: 8,
    userRating: 8,
    userFeltBetter: true
  };
  
  const testUser = {
    postalCode: '1234AB',
    birthYear: 2008,
    userType: 'jongere' as const,
    analyticsConsent: true
  };
  
  const result = await analytics.trackConversationEnd(testMetrics, testUser);
  
  if (result.success) {
    console.log('✅ Analytics tracking werkt!');
    console.log('Check het dashboard om de test data te zien');
  } else {
    console.log('❌ Analytics tracking mislukt:', result.error);
  }
}
```

### Test 3: Controleer in Dashboard

1. Open Analytics Dashboard
2. Ga naar "Overzicht" pagina
3. Kijk of "Totaal Gebeurtenissen" is gestegen
4. Ga naar "Demografie" pagina
5. Bekijk "Thema Frequentie Analyse" - zie je de thema's?

---

## 🔒 Privacy & Consent

### Consent UI Implementeren

Je moet gebruikers toestemming vragen voor analytics. Voorbeeld:

```typescript
// screens/OnboardingScreen.tsx
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

function AnalyticsConsentScreen() {
  const [consent, setConsent] = useState(false);

  const handleContinue = async () => {
    await saveUserConsent(consent);
    // ... ga verder met onboarding
  };

  return (
    <View>
      <Text style={styles.title}>Help ons verbeteren</Text>
      <Text style={styles.description}>
        We willen {APP_NAME} graag verbeteren. Hiervoor verzamelen we
        geanonimiseerde gegevens over hoe de app gebruikt wordt.
      </Text>
      
      <View style={styles.consentBox}>
        <Text style={styles.label}>
          Ik geef toestemming voor geanonimiseerde analytics
        </Text>
        <Switch value={consent} onValueChange={setConsent} />
      </View>

      <Text style={styles.privacyNote}>
        We verzamelen GEEN:
        • Namen of persoonlijke informatie
        • Exacte locaties (alleen eerste 4 cijfers postcode)
        • Exacte leeftijden (alleen leeftijdsgroepen)
        • Gespreksinhoud (alleen thema's)
      </Text>

      <Button onPress={handleContinue}>Doorgaan</Button>
    </View>
  );
}
```

### Consent Intrekken

Geef gebruikers de optie om consent in te trekken:

```typescript
// screens/SettingsScreen.tsx
function AnalyticsSettings() {
  const { user, updateUser } = useUser();

  const toggleAnalytics = async (enabled: boolean) => {
    await updateUser({ analyticsConsent: enabled });
    
    if (!enabled) {
      Alert.alert(
        'Analytics uitgeschakeld',
        'We verzamelen geen analytics meer. Eerder verzamelde data blijft geanonimiseerd bewaard.'
      );
    }
  };

  return (
    <View>
      <Text>Analytics & Verbetering</Text>
      <Switch 
        value={user.analyticsConsent} 
        onValueChange={toggleAnalytics} 
      />
      <Text style={styles.help}>
        Help ons {APP_NAME} te verbeteren door geanonimiseerde 
        gebruiksgegevens te delen.
      </Text>
    </View>
  );
}
```

---

## 🐛 Troubleshooting

### Probleem: "Analytics not initialized"

**Oplossing:** Zorg dat `initializeAnalytics()` wordt aangeroepen voordat je `getAnalytics()` gebruikt.

```typescript
// App.tsx - bij app start
useEffect(() => {
  initializeAnalytics({...});
}, []);
```

### Probleem: "OpenAI API error: 401"

**Oplossing:** Controleer of je `OPENAI_API_KEY` correct is ingesteld.

```bash
# Check .env bestand
cat .env | grep OPENAI_API_KEY
```

### Probleem: "Analytics API error: 401"

**Oplossing:** Je `ANALYTICS_API_KEY` is incorrect of verlopen.

1. Ga naar Analytics Dashboard → API-sleutels
2. Genereer een nieuwe key
3. Update je `.env` bestand

### Probleem: Themes worden niet gedetecteerd

**Oplossing:** 
1. Check of de OpenAI Assistant correct reageert
2. Test handmatig met een bekend gesprek
3. Kijk in de logs: `console.log('[Analytics] Detected themes:', themes)`

### Probleem: Analytics vertraagt de app

**Oplossing:** Analytics draait asynchroon en mag de app niet blokkeren. Als het toch gebeurt:

```typescript
// Gebruik fire-and-forget pattern
handleConversationEnd().then(() => {
  // Don't await analytics
  trackConversation(data).catch(console.error);
});
```

---

## 📊 Wat wordt er Verzameld?

### ✅ Wel verzameld (geanonimiseerd):
- Eerste 4 cijfers postcode (bijv. "1234")
- Leeftijdsgroep (bijv. "13-15", niet exacte leeftijd)
- Gebruikerstype (jongere/ouder)
- Besproken thema's (bijv. "pesten", "school")
- Sessieduur in minuten
- Aantal berichten
- Tevredenheidsscore (als gegeven)
- Zelfgerapporteerde verbetering (als gegeven)

### ❌ NIET verzameld:
- Namen
- Email adressen
- Exacte postcodes
- Exacte leeftijden
- Gespreksinhoud (alleen thema's)
- IP adressen
- Device IDs
- Locatiegegevens

---

## 🔄 Updates & Onderhoud

### Nieuwe Thema's Toevoegen

Als je nieuwe thema's wilt detecteren:

1. Open `AnalyticsService.ts`
2. Voeg toe aan `AVAILABLE_THEMES`:

```typescript
export const AVAILABLE_THEMES = [
  'pesten',
  'school',
  // ... bestaande thema's
  'nieuw-thema', // ← voeg hier toe
] as const;
```

3. Rebuild je app
4. Nieuwe gesprekken zullen het nieuwe thema detecteren

### Analytics Uitschakelen (Development)

Voor development kun je analytics tijdelijk uitschakelen:

```env
# .env.development
ANALYTICS_ENABLED=false
```

Of in code:

```typescript
const analytics = initializeAnalytics({
  ...config,
  enabled: !__DEV__ // Alleen in production
});
```

---

## 📞 Support

Bij problemen of vragen:

1. Check de logs: `console.log` statements in AnalyticsService
2. Test de verbinding met `testConnection()`
3. Controleer het Analytics Dashboard voor inkomende data
4. Neem contact op met het development team

---

## ✅ Checklist voor Go-Live

Voordat je analytics in production zet:

- [ ] API keys gegenereerd in Analytics Dashboard
- [ ] Environment variables correct ingesteld
- [ ] Consent UI geïmplementeerd
- [ ] Privacy policy updated met analytics informatie
- [ ] Test connection succesvol
- [ ] Test data zichtbaar in dashboard
- [ ] Error handling getest
- [ ] Analytics kan uitgeschakeld worden door gebruiker
- [ ] Logs gecontroleerd (geen errors)
- [ ] Team getraind in dashboard gebruik

---

**Versie:** 1.0.0  
**Laatst bijgewerkt:** December 2025
