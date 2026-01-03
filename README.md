# Dashboard voor Matti en Opvoedmaatje

Een uitgebreid analytics dashboard platform voor het verzamelen, opslaan en visualiseren van geanonimiseerde gebruiksdata van de Matti en Opvoedmaatje gezinsondersteuning apps.

## 🎯 Overzicht

Dit platform biedt een complete oplossing voor het monitoren van gebruiksstatistieken en het identificeren van trends in de Matti (voor jongeren) en Opvoedmaatje (voor ouders) applicaties. Alle data wordt volledig geanonimiseerd verzameld volgens privacy-richtlijnen.

## ✨ Functionaliteiten

### Dashboard Pagina's
- **Overzicht**: Totaal aantal gebeurtenissen, unieke gebruikers, terugkerende gebruikers, en hoog-risico gebruikers
- **Demografie**: Leeftijdsgroepen, gebruikerstypen, gezinstypen, postcode gebieden, en thema frequentie analyse
- **Betrokkenheid**: Sessieduur trends, berichtenaantal trends, en betrokkenheidskwaliteit metrics
- **Risicobeoordeling**: Hoog-risico gebruikers, veiligheidssignalen, en zelfgerapporteerde verbeteringen

### Technische Features
- **REST API**: POST `/api/analytics/event` endpoint voor data-ingestie
- **Authenticatie**: X-API-Key header validatie voor API toegang
- **Admin Dashboard**: Google OAuth authenticatie met role-based access control
- **API Keys Management**: Genereer en beheer API keys voor Matti/Opvoedmaatje integratie
- **Datum Filters**: Flexibele datum range filters (7/30/90 dagen + aangepast)
- **Data Refresh**: Real-time data verversing op alle pagina's
- **TypeScript Client Library**: Type-safe client voor eenvoudige app integratie

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS 4, Recharts
- **Backend**: Node.js, Express, tRPC 11
- **Database**: TiDB (MySQL-compatible) met Drizzle ORM
- **Authenticatie**: Google OAuth via Manus platform
- **Deployment**: Manus hosting platform

## 📊 Database Schema

De `analytics_events` tabel slaat de volgende velden op:

- `appName`: "matti" of "opvoedmaatje"
- `timestamp`: Tijdstip van gebeurtenis
- `postalCodeArea`: Eerste 4 cijfers van postcode (geanonimiseerd)
- `ageGroup`: Leeftijdscategorie
- `userType`: "jongere", "ouder", of "samengesteld"
- `familyType`: Type gezinssituatie
- `themes`: JSON array van besproken thema's
- `sessionDuration`: Sessieduur in minuten
- `messageCount`: Aantal berichten in sessie
- `isHighRisk`: Boolean voor hoog-risico indicator
- `safetySignal`: Boolean voor veiligheidssignaal
- `referralType`: Type doorverwijzing (indien van toepassing)
- `daysToReferral`: Dagen tot doorverwijzing
- `satisfactionScore`: Tevredenheidsscore (1-10)
- `selfReportedImprovement`: Boolean voor zelfgerapporteerde verbetering

## 🚀 Installatie & Setup

### Vereisten
- Node.js 22+
- pnpm package manager
- TiDB database (of MySQL-compatible database)

### Lokale Development

```bash
# Installeer dependencies
pnpm install

# Database schema pushen
pnpm db:push

# Test data genereren (optioneel)
pnpm tsx scripts/seed-test-data.ts

# Development server starten
pnpm dev
```

De applicatie draait op `http://localhost:3000`

## 🔑 API Gebruik

### Analytics Event Verzenden

```typescript
import { sendAnalyticsEvent } from './lib/analytics-sender';

// Event verzenden
await sendAnalyticsEvent({
  appName: 'matti',
  postalCodeArea: '1234',
  ageGroup: '13-15',
  userType: 'jongere',
  themes: ['school', 'stress', 'identiteit'],
  sessionDuration: 15,
  messageCount: 8,
  isHighRisk: false,
  safetySignal: false,
  satisfactionScore: 8,
  selfReportedImprovement: true
}, 'your-api-key-here');
```

### API Key Genereren

1. Log in op het dashboard als admin
2. Navigeer naar "API-sleutels" pagina
3. Klik op "Nieuwe API-sleutel"
4. Geef een naam en beschrijving
5. Kopieer de gegenereerde API key (wordt maar één keer getoond!)

## 📁 Project Structuur

```
analytics-dashboard/
├── client/                 # Frontend React applicatie
│   ├── src/
│   │   ├── pages/         # Dashboard pagina's
│   │   ├── components/    # Herbruikbare UI componenten
│   │   └── lib/           # Utilities en helpers
├── server/                # Backend tRPC server
│   ├── routers/          # tRPC routers per feature
│   ├── routes/           # REST API endpoints
│   └── db.ts             # Database helpers
├── drizzle/              # Database schema & migraties
├── scripts/              # Utility scripts (seed data, etc.)
└── lib/                  # Gedeelde TypeScript types en client library
```

## 🔒 Privacy & Beveiliging

- **Geanonimiseerde Data**: Geen persoonlijke identificeerbare informatie wordt opgeslagen
- **Postcode Anonymisatie**: Alleen eerste 4 cijfers van postcode
- **Leeftijdsgroepen**: Exacte leeftijden worden niet opgeslagen
- **API Key Authenticatie**: Alle API requests vereisen geldige API key
- **Role-Based Access**: Admin dashboard alleen toegankelijk voor geautoriseerde gebruikers
- **HTTPS**: Alle communicatie via versleutelde verbindingen

## 📈 Visualisaties

Het dashboard bevat de volgende interactieve visualisaties:

- **Pie Charts**: Leeftijdsgroepen, gebruikerstypen, gezinstypen
- **Bar Charts**: Postcode gebieden (top 20), thema frequentie (top 10)
- **Line Charts**: Sessieduur trends, berichtenaantal trends over tijd
- **Metric Cards**: Key performance indicators met real-time data

Alle visualisaties ondersteunen:
- Datum range filtering
- App filtering (Matti vs Opvoedmaatje)
- Data refresh functionaliteit
- Responsive design voor mobile/tablet/desktop

## 🧪 Testing

```bash
# Run alle tests
pnpm test

# Test data genereren
pnpm tsx scripts/seed-test-data.ts
```

## 📝 Licentie

Dit project is privé en bedoeld voor intern gebruik door het Matti en Opvoedmaatje team.

## 👥 Contact

Voor vragen of ondersteuning, neem contact op met het development team.

---

**Laatste Update**: December 2025  
**Versie**: 1.0.0  
**Status**: Production Ready ✅
