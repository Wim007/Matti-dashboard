# Emoji-Based Scoring voor Matti & Opvoedmaatje

## 🎯 Waarom Emoji's?

Jongeren en pubers vinden cijfers invullen **saai en langzaam**. Emoji's zijn:
- ✅ **Sneller**: 1 tap in plaats van typen
- ✅ **Leuker**: Visueel engaging en minder bedreigend
- ✅ **Duidelijker**: Emoties zijn universeel herkenbaar
- ✅ **Betrouwbaar**: Vertaalt automatisch naar cijfers voor analytics

**Design filosofie**: *Design for the user, measure for the funder*

---

## 😊 Emoji Mapping Systeem

### Optie 1: Emotie Schaal (Aanbevolen voor Matti)

```
😄 Goed           → score: 2  (1-2 range)
🙂 Oké            → score: 4  (3-4 range)
😐 Niet zo        → score: 6  (5-6 range)
😟 Slecht         → score: 8  (7-8 range)
😢 Heel slecht    → score: 10 (9-10 range)
```

**Gebruik in gesprek:**
```
Matti: "Hoe gaat het met pesten op school?"

[Toon 5 emoji buttons]
😄 Goed
🙂 Oké
😐 Niet zo
😟 Slecht
😢 Heel slecht

[Gebruiker tikt emoji]
→ Backend slaat op: theme="pesten", scoreStart=8 (als 😟 gekozen)
```

### Optie 2: Verandering Schaal (Voor Follow-up)

```
👍👍 Veel beter     → verbetering: +4
👍   Beetje beter   → verbetering: +2
👌   Hetzelfde      → verbetering: 0
👎   Beetje slechter → verbetering: -2
👎👎 Veel slechter  → verbetering: -4
```

**Gebruik bij vervolggesprek:**
```
Matti: "Vorige keer zei je dat pesten 😟 Slecht was. Hoe gaat het nu?"

[Toon 5 verandering buttons]
👍👍 Veel beter
👍 Beetje beter
👌 Hetzelfde
👎 Beetje slechter
👎👎 Veel slechter

[Gebruiker tikt 👍 Beetje beter]
→ Backend berekent: scoreCurrent = scoreStart - 2 = 6
→ Dashboard toont: 25% verbetering
```

---

## 💻 Implementatie in Matti

### 1. Frontend UI Component (React Native)

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EmojiScoreProps {
  onSelect: (score: number, emoji: string) => void;
  type: 'initial' | 'followup';
}

const EMOJI_SCORES = [
  { emoji: '😄', label: 'Goed', score: 2 },
  { emoji: '🙂', label: 'Oké', score: 4 },
  { emoji: '😐', label: 'Niet zo', score: 6 },
  { emoji: '😟', label: 'Slecht', score: 8 },
  { emoji: '😢', label: 'Heel slecht', score: 10 },
];

const CHANGE_SCORES = [
  { emoji: '👍👍', label: 'Veel beter', change: -4 },
  { emoji: '👍', label: 'Beetje beter', change: -2 },
  { emoji: '👌', label: 'Hetzelfde', change: 0 },
  { emoji: '👎', label: 'Beetje slechter', change: +2 },
  { emoji: '👎👎', label: 'Veel slechter', change: +4 },
];

export function EmojiScoreSelector({ onSelect, type }: EmojiScoreProps) {
  const options = type === 'initial' ? EMOJI_SCORES : CHANGE_SCORES;

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.emoji}
          style={styles.button}
          onPress={() => onSelect(
            type === 'initial' ? option.score : option.change,
            option.emoji
          )}
        >
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Text style={styles.label}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 12,
    paddingVertical: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
  },
});
```

### 2. Integratie met OpenAI Assistant

```typescript
import { getAnalytics } from './services/AnalyticsService';

// Wanneer Matti een thema detecteert (eerste keer)
async function handleThemeDetected(theme: string, userId: string) {
  // Vraag emoji score
  const message = `Hoe gaat het met ${theme}?`;
  
  // Toon EmojiScoreSelector (type='initial')
  // Wacht op gebruiker selectie...
  
  const selectedScore = await showEmojiSelector('initial');
  
  // Sla op in lokale database EN analytics
  await saveThemeScore({
    userId,
    theme,
    scoreStart: selectedScore,
    emoji: selectedEmoji,
    measuredAt: new Date(),
  });
  
  // Optioneel: stuur naar analytics dashboard
  const analytics = getAnalytics();
  await analytics.trackThemeScore({
    userId,
    theme,
    scoreStart: selectedScore,
    appName: 'matti',
  });
}

// Bij vervolggesprek over hetzelfde thema
async function handleFollowUpTheme(theme: string, userId: string, previousScore: number) {
  const message = `Vorige keer zei je dat ${theme} ${getEmojiForScore(previousScore)} was. Hoe gaat het nu?`;
  
  // Toon EmojiScoreSelector (type='followup')
  const change = await showEmojiSelector('followup');
  const scoreCurrent = Math.max(1, Math.min(10, previousScore + change));
  
  // Update in database
  await updateThemeScore({
    userId,
    theme,
    scoreCurrent,
    followUpAt: new Date(),
  });
  
  // Stuur naar analytics
  const analytics = getAnalytics();
  await analytics.trackThemeImprovement({
    userId,
    theme,
    scoreStart: previousScore,
    scoreCurrent,
    appName: 'matti',
  });
}

function getEmojiForScore(score: number): string {
  if (score <= 2) return '😄 Goed';
  if (score <= 4) return '🙂 Oké';
  if (score <= 6) return '😐 Niet zo';
  if (score <= 8) return '😟 Slecht';
  return '😢 Heel slecht';
}
```

### 3. Backend Conversie (AnalyticsService.ts)

```typescript
// In AnalyticsService.ts - voeg toe:

export interface EmojiScoreMapping {
  emoji: string;
  score: number;
  label: string;
}

export const EMOJI_TO_SCORE: Record<string, number> = {
  '😄': 2,
  '🙂': 4,
  '😐': 6,
  '😟': 8,
  '😢': 10,
};

export const CHANGE_EMOJI_TO_DELTA: Record<string, number> = {
  '👍👍': -4,
  '👍': -2,
  '👌': 0,
  '👎': +2,
  '👎👎': +4,
};

// Helper functie om emoji naar score te converteren
export function emojiToScore(emoji: string): number {
  return EMOJI_TO_SCORE[emoji] || 5; // Default middle score
}

// Helper functie om score naar emoji te converteren
export function scoreToEmoji(score: number): string {
  if (score <= 2) return '😄';
  if (score <= 4) return '🙂';
  if (score <= 6) return '😐';
  if (score <= 8) return '😟';
  return '😢';
}

// Nieuwe methode in AnalyticsService class:
async trackThemeScore(params: {
  userId: string;
  theme: string;
  scoreStart: number;
  emoji?: string; // Optioneel: sla emoji op voor debugging
  appName: AppName;
}): Promise<void> {
  if (!this.config.enabled) return;

  try {
    // Verstuur naar analytics dashboard
    await this.sendToAnalytics({
      endpoint: '/api/analytics/theme-score',
      data: {
        userId: this.anonymizeUserId(params.userId),
        theme: params.theme,
        scoreStart: params.scoreStart,
        emoji: params.emoji,
        appName: params.appName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to track theme score:', error);
  }
}
```

---

## 📊 Dashboard Weergave

Het dashboard **ziet geen emoji's**, alleen cijfers:

```
Verbetering na Gesprekken: 45%
Gemiddeld na 1.6 gesprekken

Per thema:
- Pesten: 52% verbetering (23 jongeren)
- Stress: 41% verbetering (34 jongeren)
- School: 38% verbetering (28 jongeren)
```

**Berekening:**
```
Verbetering = ((scoreStart - scoreCurrent) / scoreStart) × 100%

Voorbeeld:
- Start: 😟 (score 8)
- Follow-up: 👍 Beetje beter → score 6
- Verbetering: ((8 - 6) / 8) × 100% = 25%
```

---

## 🎨 UX Best Practices

### DO's ✅
- Gebruik grote, duidelijke emoji buttons (min. 48x48px)
- Toon emoji + tekst label samen
- Gebruik consistente emoji's door hele app
- Geef haptic feedback bij selectie
- Animeer emoji bij hover/press
- Bewaar laatste emoji voor context in vervolggesprekken

### DON'Ts ❌
- Gebruik GEEN cijfers in de UI voor jongeren
- Vraag NIET te vaak (max 1x per thema per week)
- Forceer GEEN antwoord (optioneel houden)
- Gebruik GEEN vage emoji's (🤔, 🤷)
- Mix GEEN verschillende emoji stijlen

---

## 🧪 A/B Testing Suggesties

Test welke emoji set het beste werkt:

**Variant A: Emotie Gezichten** (Aanbevolen)
```
😄 🙂 😐 😟 😢
```

**Variant B: Duimen**
```
👍👍 👍 👌 👎 👎👎
```

**Variant C: Harten** (Voor positieve thema's)
```
💚💚 💚 💛 🧡 ❤️
```

**Metrics om te meten:**
- Response rate (% gebruikers die emoji selecteren)
- Time to select (snelheid)
- Follow-up completion rate
- User feedback

---

## 📝 Implementatie Checklist

- [ ] Voeg EmojiScoreSelector component toe aan Matti
- [ ] Integreer met OpenAI Assistant flow
- [ ] Implementeer emoji-to-score conversie in backend
- [ ] Test met 10-20 jongeren (beta groep)
- [ ] Meet response rate vs. oude cijfer systeem
- [ ] Train Matti om emoji's natuurlijk te integreren in gesprek
- [ ] Update analytics dashboard queries (geen wijzigingen nodig!)
- [ ] Documenteer voor Opvoedmaatje (mogelijk andere emoji set voor ouders)

---

## 🎯 Verwachte Impact

**Voor Jongeren:**
- 🚀 3-5x hogere response rate
- ⚡ 50% snellere selectie
- 😊 Positievere gebruikerservaring
- 🔄 Hogere follow-up completion

**Voor Financiers:**
- 📊 Betrouwbaardere data (meer responses)
- 💰 Sterkere funding case (hogere engagement)
- 📈 Betere longitudinale tracking
- ✅ Geen verschil in dashboard metrics

**Win-win**: Jongeren krijgen leuke UI, verzekeraars krijgen betrouwbare data! 🎉
