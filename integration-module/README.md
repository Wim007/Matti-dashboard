# Analytics Integration Module voor Matti & Opvoedmaatje

Complete standalone module voor het integreren van analytics tracking in de Matti en Opvoedmaatje React Native apps.

---

## 📦 Wat zit erin?

Deze module bevat alles wat je nodig hebt om analytics te integreren:

1. **AnalyticsService.ts** - Complete TypeScript service voor:
   - Automatische thema detectie via OpenAI Assistant API
   - Analytics event tracking naar dashboard
   - Privacy-compliant data verzameling
   - Error handling en offline support

2. **SETUP.md** - Stap-voor-stap setup guide met:
   - Installatie instructies
   - Environment configuratie
   - API key generatie
   - Privacy & consent implementatie
   - Troubleshooting

3. **EXAMPLES.md** - Praktische code voorbeelden voor:
   - Basis integratie
   - Conversation tracking
   - Feedback dialogs
   - Testing & debugging
   - Advanced use cases

---

## 🚀 Quick Start

### 1. Kopieer Bestanden

```bash
# In je Matti/Opvoedmaatje project
mkdir -p src/services
cp AnalyticsService.ts src/services/
```

### 2. Installeer Dependencies

```bash
npm install @react-native-async-storage/async-storage
```

### 3. Configureer

```typescript
// App.tsx
import { initializeAnalytics } from './services/AnalyticsService';

initializeAnalytics({
  apiUrl: 'https://jouw-dashboard.manus.space',
  apiKey: 'jouw_api_key',
  appName: 'matti', // of 'opvoedmaatje'
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiAssistantId: process.env.OPENAI_ASSISTANT_ID,
  enabled: true
});
```

### 4. Gebruik

```typescript
// Bij conversation end
import { getAnalytics } from './services/AnalyticsService';

const analytics = getAnalytics();
await analytics.trackConversationEnd(conversationMetrics, userData);
```

---

## 📚 Documentatie

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[EXAMPLES.md](./EXAMPLES.md)** - Code voorbeelden voor alle scenario's

---

## ✨ Features

### Automatische Thema Detectie
- Gebruikt OpenAI Assistant API om besproken thema's te detecteren
- Ondersteunt 20+ thema categorieën (pesten, school, stress, etc.)
- Werkt met jullie bestaande OpenAI setup

### Privacy-First
- Geen persoonlijke informatie opgeslagen
- Alleen eerste 4 cijfers postcode
- Leeftijdsgroepen i.p.v. exacte leeftijden
- Thema's i.p.v. gespreksinhoud
- User consent vereist

### Robuust & Betrouwbaar
- Fail-safe: analytics mag nooit de app breken
- Offline queue support
- Automatic retry logic
- Comprehensive error handling

### Easy Integration
- Standalone TypeScript module
- Geen externe dependencies (behalve AsyncStorage)
- Works with existing OpenAI setup
- Minimal code changes needed

---

## 🔧 Technische Details

### Ondersteunde Thema's

```typescript
const AVAILABLE_THEMES = [
  'pesten', 'school', 'stress', 'identiteit', 'relaties',
  'ouders', 'gezin', 'toekomst', 'emoties', 'vriendschap',
  'zelfvertrouwen', 'schulden', 'werk', 'gezondheid',
  'verslaving', 'eenzaamheid', 'rouw', 'seksualiteit',
  'zwangerschap', 'huiselijk-geweld'
];
```

### Data Schema

```typescript
interface AnalyticsEvent {
  appName: 'matti' | 'opvoedmaatje';
  postalCodeArea: string;          // Eerste 4 cijfers
  ageGroup: string;                 // '13-15', '16-18', etc.
  userType: 'jongere' | 'ouder';
  themes: string[];                 // Gedetecteerde thema's
  sessionDuration: number;          // Minuten
  messageCount: number;
  isHighRisk: boolean;             // 3+ thema's
  safetySignal: boolean;           // Crisis detectie
  satisfactionScore?: number;       // 1-10
  selfReportedImprovement?: boolean;
}
```

### API Endpoints

**Analytics Dashboard API:**
- `POST /api/analytics/event` - Verzend analytics event
- Authenticatie: `X-API-Key` header

**OpenAI Assistant API:**
- `POST /threads/{threadId}/messages` - Voeg message toe
- `POST /threads/{threadId}/runs` - Run assistant
- `GET /threads/{threadId}/runs/{runId}` - Check run status
- `GET /threads/{threadId}/messages` - Haal messages op

---

## 🧪 Testing

### Test Connection

```typescript
import { getAnalytics } from './services/AnalyticsService';

const analytics = getAnalytics();
const success = await analytics.testConnection();

if (success) {
  console.log('✅ Analytics werkt!');
}
```

### Test met Fake Data

```typescript
await analytics.trackConversationEnd(
  {
    threadId: 'test_123',
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
```

### Controleer Dashboard

1. Open Analytics Dashboard
2. Ga naar "Overzicht" → zie totaal gebeurtenissen
3. Ga naar "Demografie" → zie thema frequentie
4. Ga naar "Betrokkenheid" → zie sessie metrics

---

## 🔒 Privacy & Compliance

### Wat wordt NIET verzameld:
- ❌ Namen
- ❌ Email adressen
- ❌ Exacte postcodes
- ❌ Exacte leeftijden
- ❌ Gespreksinhoud
- ❌ IP adressen
- ❌ Device IDs

### Wat wordt WEL verzameld:
- ✅ Eerste 4 cijfers postcode (bijv. "1234")
- ✅ Leeftijdsgroep (bijv. "13-15")
- ✅ Besproken thema's (bijv. "pesten", "school")
- ✅ Sessieduur en berichtenaantal
- ✅ Tevredenheidsscore (optioneel)

### User Consent
- Gebruikers moeten expliciet toestemming geven
- Consent kan altijd ingetrokken worden
- Analytics wordt automatisch overgeslagen zonder consent

---

## 📊 Dashboard Features

Na integratie zie je in het dashboard:

### Overzicht Pagina
- Totaal aantal gebeurtenissen
- Unieke gebruikers
- Terugkerende gebruikers
- Hoog-risico gebruikers

### Demografie Pagina
- Leeftijdsgroepen verdeling
- Gebruikerstypen (jongere/ouder)
- Postcode gebieden (top 20)
- **Thema frequentie analyse** ← Jouw gedetecteerde thema's!

### Betrokkenheid Pagina
- Sessieduur trends over tijd
- Berichtenaantal trends
- Betrokkenheidskwaliteit metrics

### Risicobeoordeling Pagina
- Hoog-risico gebruikers trends
- Veiligheidssignalen
- Verbeteringspercentage

---

## 🐛 Troubleshooting

### Analytics werkt niet

**Check 1: Is analytics geïnitialiseerd?**
```typescript
// App.tsx - bij app start
initializeAnalytics({...});
```

**Check 2: Is API key correct?**
```bash
# Test met curl
curl -X POST https://jouw-dashboard.manus.space/api/analytics/event \
  -H "X-API-Key: jouw_api_key" \
  -H "Content-Type: application/json" \
  -d '{"appName":"matti",...}'
```

**Check 3: Heeft user consent gegeven?**
```typescript
if (!user.analyticsConsent) {
  console.log('User has not given analytics consent');
}
```

### Thema's worden niet gedetecteerd

**Check 1: OpenAI API key correct?**
```typescript
// Test OpenAI verbinding
const response = await fetch('https://api.openai.com/v1/models', {
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
});
```

**Check 2: Assistant ID correct?**
```bash
# Check in OpenAI dashboard
# https://platform.openai.com/assistants
```

**Check 3: Thread ID bestaat?**
```typescript
console.log('Analyzing thread:', threadId);
// Moet een geldig OpenAI thread ID zijn
```

### Performance problemen

**Probleem:** Analytics vertraagt app

**Oplossing:** Gebruik fire-and-forget pattern
```typescript
// Wacht NIET op analytics
trackConversation(data).catch(console.error);

// Ga direct verder
navigation.goBack();
```

---

## 📞 Support

Bij vragen of problemen:

1. **Check de documentatie:**
   - [SETUP.md](./SETUP.md) voor installatie
   - [EXAMPLES.md](./EXAMPLES.md) voor code voorbeelden

2. **Check de logs:**
   ```typescript
   // Enable debug logging
   console.log('[Analytics] ...');
   ```

3. **Test de verbinding:**
   ```typescript
   await analytics.testConnection();
   ```

4. **Contact development team**

---

## 📝 Changelog

### Version 1.0.0 (December 2025)
- Initial release
- OpenAI Assistant API integration
- Theme detection (20+ themes)
- Privacy-compliant data collection
- Offline queue support
- Comprehensive error handling
- Complete documentation

---

## 📄 Licentie

Dit is proprietary software voor intern gebruik door Matti en Opvoedmaatje.

---

## 🎯 Next Steps

1. **Lees [SETUP.md](./SETUP.md)** voor complete installatie instructies
2. **Bekijk [EXAMPLES.md](./EXAMPLES.md)** voor praktische code voorbeelden
3. **Genereer API keys** in het Analytics Dashboard
4. **Implementeer consent UI** voor gebruikers
5. **Test de integratie** met test data
6. **Deploy naar production** en monitor het dashboard!

---

**Veel succes met de integratie! 🚀**
