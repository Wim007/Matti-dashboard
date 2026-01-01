/**
 * PDF Export Utility for Impact Report
 * 
 * Generates professional PDF reports for executive presentations
 */

import { getDb } from "./db";
import { getCostAvoidanceStats, getEscalationPreventionStats, getImprovementStats } from "./db-funding";

export interface ReportData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    totalUsers: number;
    dayCount: number;
  };
  costAvoidance: {
    totalAvoidedCost: number;
    preventedJeugdGGZ: number;
    preventedCrisis: number;
    preventedSpecialistCare: number;
    preventedOutOfHome: number;
    breakdown: Array<{
      careType: string;
      count: number;
      costPerCase: number;
      totalCost: number;
    }>;
  };
  escalationPrevention: {
    highRiskUsers: number;
    stabilizedUsers: number;
    preventionRate: number;
  };
  improvementStats: {
    averageImprovement: number;
    totalMeasurements: number;
    averageConversations: number;
    byTheme: Array<{
      theme: string;
      improvement: number;
      count: number;
    }>;
  };
  roi: {
    operatingCost: number;
    savings: number;
    roiPercentage: number;
  };
}

/**
 * Generate HTML for PDF export
 * This HTML will be converted to PDF using a headless browser or PDF library
 */
export function generateReportHTML(data: ReportData): string {
  const { dateRange, summary, costAvoidance, escalationPrevention, improvementStats, roi } = data;

  const startDate = new Date(dateRange.startDate).toLocaleDateString("nl-NL");
  const endDate = new Date(dateRange.endDate).toLocaleDateString("nl-NL");

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Impact Rapport - Matti & Opvoedmaatje</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 21cm;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2cm;
      padding-bottom: 1cm;
      border-bottom: 3px solid #10b981;
    }
    
    h1 {
      font-size: 32pt;
      margin: 0;
      color: #10b981;
    }
    
    .subtitle {
      font-size: 14pt;
      color: #666;
      margin-top: 0.5cm;
    }
    
    .period {
      font-size: 12pt;
      color: #888;
      margin-top: 0.3cm;
    }
    
    .executive-summary {
      background: #f8f9fa;
      padding: 1cm;
      border-radius: 8px;
      margin: 1cm 0;
    }
    
    .executive-summary h2 {
      margin-top: 0;
      color: #10b981;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5cm;
      margin: 1cm 0;
    }
    
    .metric-card {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.8cm;
      text-align: center;
    }
    
    .metric-card.green {
      border-color: #10b981;
      background: #f0fdf4;
    }
    
    .metric-card.orange {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    
    .metric-card.cyan {
      border-color: #06b6d4;
      background: #ecfeff;
    }
    
    .metric-label {
      font-size: 10pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 28pt;
      font-weight: bold;
      margin: 0.2cm 0;
    }
    
    .metric-card.green .metric-value {
      color: #10b981;
    }
    
    .metric-card.orange .metric-value {
      color: #f59e0b;
    }
    
    .metric-card.cyan .metric-value {
      color: #06b6d4;
    }
    
    .metric-detail {
      font-size: 9pt;
      color: #888;
    }
    
    .section {
      margin: 1.5cm 0;
      page-break-inside: avoid;
    }
    
    .section h2 {
      color: #10b981;
      border-bottom: 2px solid #10b981;
      padding-bottom: 0.3cm;
      margin-bottom: 0.8cm;
    }
    
    .cost-breakdown {
      margin: 0.5cm 0;
    }
    
    .cost-item {
      display: flex;
      justify-content: space-between;
      padding: 0.4cm;
      background: #f8f9fa;
      margin-bottom: 0.3cm;
      border-radius: 4px;
    }
    
    .cost-item.total {
      background: #10b981;
      color: white;
      font-weight: bold;
      font-size: 12pt;
    }
    
    .cost-name {
      font-weight: 500;
    }
    
    .cost-detail {
      font-size: 9pt;
      color: #666;
    }
    
    .cost-amount {
      font-weight: bold;
      font-size: 14pt;
    }
    
    .insights {
      background: #fffbeb;
      padding: 1cm;
      border-left: 4px solid #f59e0b;
      margin: 1cm 0;
    }
    
    .insight-item {
      margin: 0.5cm 0;
    }
    
    .insight-item strong {
      color: #f59e0b;
    }
    
    .recommendations {
      background: #ecfeff;
      padding: 1cm;
      border-left: 4px solid #06b6d4;
      margin: 1cm 0;
    }
    
    .recommendation-item {
      margin: 0.5cm 0;
      padding-left: 0.5cm;
    }
    
    .recommendation-item strong {
      color: #06b6d4;
    }
    
    .footer {
      margin-top: 2cm;
      padding-top: 1cm;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Impact Rapport</h1>
    <div class="subtitle">Matti & Opvoedmaatje</div>
    <div class="period">Periode: ${startDate} - ${endDate}</div>
  </div>

  <div class="executive-summary">
    <h2>Executive Summary</h2>
    <p>
      Matti en Opvoedmaatje hebben in de afgelopen <strong>${summary.dayCount} dagen</strong> 
      <strong>${summary.totalEvents} gesprekken</strong> gevoerd met jongeren en ouders.
      De apps hebben een meetbare impact op het voorkomen van escalatie en het verminderen van zorgkosten.
    </p>
  </div>

  <div class="metrics-grid">
    <div class="metric-card green">
      <div class="metric-label">Vermeden Kosten</div>
      <div class="metric-value">€${Math.round(costAvoidance.totalAvoidedCost / 1000)}k</div>
      <div class="metric-detail">Door preventie van ${costAvoidance.preventedJeugdGGZ} doorverwijzingen</div>
    </div>

    <div class="metric-card orange">
      <div class="metric-label">Escalatie Voorkomen</div>
      <div class="metric-value">${escalationPrevention.preventionRate.toFixed(0)}%</div>
      <div class="metric-detail">${escalationPrevention.stabilizedUsers} van ${escalationPrevention.highRiskUsers} hoog-risico gebruikers</div>
    </div>

    <div class="metric-card green">
      <div class="metric-label">Verbetering</div>
      <div class="metric-value">${improvementStats.averageImprovement.toFixed(0)}%</div>
      <div class="metric-detail">Na gemiddeld ${improvementStats.averageConversations.toFixed(1)} gesprekken</div>
    </div>

    <div class="metric-card cyan">
      <div class="metric-label">Snelheid</div>
      <div class="metric-value">0 dagen</div>
      <div class="metric-detail">vs. 120 dagen wachttijd reguliere zorg</div>
    </div>
  </div>

  <div class="section">
    <h2>Return on Investment (ROI)</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Operationele Kosten</div>
        <div class="metric-value" style="color: #ef4444;">€${roi.operatingCost.toLocaleString()}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-label">Vermeden Zorgkosten</div>
        <div class="metric-value">€${roi.savings.toLocaleString()}</div>
      </div>
    </div>
    <div style="text-align: center; margin-top: 1cm;">
      <div class="metric-label">ROI</div>
      <div style="font-size: 36pt; font-weight: bold; color: #10b981;">
        ${roi.roiPercentage.toFixed(0)}%
      </div>
      <p style="font-size: 9pt; color: #888;">
        * ROI berekend als (Vermeden Kosten - Operationele Kosten) / Operationele Kosten × 100%
      </p>
    </div>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <h2>Vermeden Kosten per Zorgtype</h2>
    <div class="cost-breakdown">
      ${costAvoidance.breakdown.map(item => `
        <div class="cost-item">
          <div>
            <div class="cost-name">${item.careType}</div>
            <div class="cost-detail">${item.count} voorkomen trajecten × €${item.costPerCase.toLocaleString()}</div>
          </div>
          <div class="cost-amount">€${Math.round(item.totalCost / 1000)}k</div>
        </div>
      `).join('')}
      
      <div class="cost-item total">
        <div>Totaal Vermeden Kosten</div>
        <div>€${Math.round(costAvoidance.totalAvoidedCost / 1000)}k</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Belangrijkste Inzichten</h2>
    <div class="insights">
      <div class="insight-item">
        <strong>Preventieve Impact:</strong> 
        ${escalationPrevention.preventionRate.toFixed(0)}% van hoog-risico gebruikers stabiliseerde zonder doorverwijzing naar specialistische zorg. 
        Dit voorkomt langdurige wachtlijsten en hogere zorgkosten.
      </div>

      <div class="insight-item">
        <strong>Meetbare Verbetering:</strong> 
        Gebruikers rapporteren gemiddeld ${improvementStats.averageImprovement.toFixed(0)}% verbetering na slechts 
        ${improvementStats.averageConversations.toFixed(1)} gesprekken. Dit toont de effectiviteit van laagdrempelige ondersteuning.
      </div>

      <div class="insight-item">
        <strong>Kosteneffectiviteit:</strong> 
        Elke euro geïnvesteerd in Matti/Opvoedmaatje levert ${(roi.savings / roi.operatingCost).toFixed(1)}× return 
        door voorkomen van duurdere zorgtrajecten.
      </div>

      <div class="insight-item">
        <strong>Directe Toegankelijkheid:</strong> 
        Gebruikers krijgen direct hulp (0 dagen wachttijd) versus 120 dagen gemiddelde wachttijd voor reguliere jeugdzorg. 
        Dit voorkomt escalatie tijdens wachttijd.
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Aanbevelingen</h2>
    <div class="recommendations">
      <div class="recommendation-item">
        <strong>1. Uitbreiden bereik:</strong> 
        Verhoog bekendheid bij huisartsen en scholen om meer jongeren en ouders vroeg te bereiken.
      </div>

      <div class="recommendation-item">
        <strong>2. Integratie met zorgketen:</strong> 
        Koppel Matti/Opvoedmaatje aan wijkteams en jeugd-GGZ voor naadloze doorverwijzing waar nodig.
      </div>

      <div class="recommendation-item">
        <strong>3. Continue monitoring:</strong> 
        Blijf verbetering en kosteneffectiviteit meten om funding te onderbouwen.
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Dit rapport is gegenereerd op ${new Date().toLocaleDateString("nl-NL")} door het Analytics Dashboard</p>
    <p>Matti & Opvoedmaatje - Laagdrempelige ondersteuning voor jongeren en ouders</p>
  </div>
</body>
</html>
  `;
}

/**
 * Collect data for PDF export
 */
export async function collectReportData(startDate: string, endDate: string): Promise<ReportData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all metrics
  const dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };
  const [costAvoidance, escalationPrevention, improvementStats] = await Promise.all([
    getCostAvoidanceStats(dateRange),
    getEscalationPreventionStats(dateRange),
    getImprovementStats(dateRange),
  ]);

  // Calculate summary stats
  const dayCount = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Estimate operating cost (€2 per conversation)
  const totalEvents = 258; // TODO: Get from actual analytics
  const operatingCost = totalEvents * 2;
  const savings = costAvoidance.totalAvoidedCost;
  const roiPercentage = savings > 0 ? ((savings - operatingCost) / operatingCost) * 100 : 0;

  return {
    dateRange: { startDate, endDate },
    summary: {
      totalEvents,
      totalUsers: 40, // TODO: Get from actual analytics
      dayCount,
    },
    costAvoidance,
    escalationPrevention,
    improvementStats,
    roi: {
      operatingCost,
      savings,
      roiPercentage,
    },
  };
}
