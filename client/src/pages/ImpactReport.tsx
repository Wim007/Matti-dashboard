import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { AgeGroupFilter, AgeGroupValue } from "@/components/AgeGroupFilter";
import { trpc } from "@/lib/trpc";
import { Download, TrendingUp, Euro, Users, Shield, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export default function ImpactReport() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90); // Default 90 days for impact report
    return { from, to };
  });

  const [ageGroup, setAgeGroup] = useState<AgeGroupValue>('all');

  const queryDateRange = useMemo(() => ({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
    ageGroup: ageGroup !== 'all' ? ageGroup : undefined,
  }), [dateRange, ageGroup]);

  const { data: improvementStats } = trpc.funding.getImprovementStats.useQuery(queryDateRange);
  const { data: costAvoidance } = trpc.funding.getCostAvoidance.useQuery(queryDateRange);
  const { data: escalationPrevention } = trpc.funding.getEscalationPrevention.useQuery(queryDateRange);
  const { data: summary } = trpc.analytics.getSummary.useQuery(queryDateRange);
  const { data: screenTimeMetrics } = trpc.behavior.screenTimeToAction.useQuery(queryDateRange);
  const { data: behaviorROI } = trpc.behavior.roi.useQuery(queryDateRange);

  const roiData = useMemo(() => {
    if (!costAvoidance) return [];
    
    // Estimated cost of running Matti/Opvoedmaatje (simplified)
    const estimatedOperatingCost = summary?.totalEvents ? summary.totalEvents * 2 : 1000; // €2 per conversation
    const savings = costAvoidance.totalAvoidedCost;
    const roi = savings > 0 ? ((savings - estimatedOperatingCost) / estimatedOperatingCost) * 100 : 0;

    return [
      { name: "Operationele Kosten", value: estimatedOperatingCost, fill: "#ef4444" },
      { name: "Vermeden Zorgkosten", value: savings, fill: "#10b981" },
    ];
  }, [costAvoidance, summary]);

  const handleExportPDF = async () => {
    try {
      const { data } = await trpc.pdf.generateImpactReport.useQuery(queryDateRange);
      if (!data) return;

      // Open HTML in new window for printing to PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export mislukt. Probeer het opnieuw.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Impact Rapport</h1>
            <p className="text-muted-foreground mt-2">
              Executive summary voor bestuurders en financiers
            </p>
          </div>
          <div className="flex gap-3">
            <AgeGroupFilter value={ageGroup} onChange={setAgeGroup} />
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
            <CardDescription>
              Periode: {dateRange.from.toLocaleDateString("nl-NL")} - {dateRange.to.toLocaleDateString("nl-NL")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed">
                  Matti heeft in de afgelopen{" "}
                  <strong>{Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} dagen</strong>{" "}
                  <strong>{summary?.totalEvents || 0} gesprekken</strong> gevoerd met jongeren tussen 12-21 jaar.
                  De app heeft een meetbare impact op het voorkomen van escalatie en het verminderen van zorgkosten.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Vermeden Kosten</span>
                  </div>
                  <div className="text-3xl font-bold">
                    €{costAvoidance ? Math.round(costAvoidance.totalAvoidedCost / 1000) : 0}k
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Door preventie van {costAvoidance?.preventedJeugdGGZ || 0} doorverwijzingen
                  </p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-500">Escalatie Voorkomen</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {escalationPrevention?.preventionRate.toFixed(0) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {escalationPrevention?.stabilizedUsers || 0} van {escalationPrevention?.highRiskUsers || 0} hoog-risico gebruikers
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Verbetering</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {improvementStats?.averageImprovement.toFixed(0) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Na gemiddeld {improvementStats?.averageConversations.toFixed(1) || 0} gesprekken
                  </p>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-cyan-500" />
                    <span className="text-sm font-medium text-cyan-500">Snelheid</span>
                  </div>
                  <div className="text-3xl font-bold">0 dagen</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs. 120 dagen wachttijd reguliere zorg
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Return on Investment (ROI)</CardTitle>
            <CardDescription>
              Vergelijking operationele kosten vs. vermeden zorgkosten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
                  />
                  <Bar dataKey="value" name="Bedrag (€)">
                    {roiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Operationele Kosten</div>
                  <div className="text-2xl font-bold text-destructive">
                    €{roiData[0]?.value.toLocaleString() || 0}
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Vermeden Zorgkosten</div>
                  <div className="text-2xl font-bold text-green-500">
                    €{roiData[1]?.value.toLocaleString() || 0}
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">ROI</div>
                  <div className="text-2xl font-bold text-green-500">
                    {roiData[1] && roiData[0] 
                      ? (((roiData[1].value - roiData[0].value) / roiData[0].value) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                * ROI berekend als (Vermeden Kosten - Operationele Kosten) / Operationele Kosten × 100%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavior Change: Screen Time to Action */}
        <Card className="border-blue-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Van Passief naar Actief
            </CardTitle>
            <CardDescription>
              Gedragsverandering: Schermtijd → Actieve Bezigheden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Totaal Interventies</div>
                <div className="text-3xl font-bold">{screenTimeMetrics?.totalCases || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Jongeren met schermtijd-zorgen
                </div>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Succesvol Verbeterd</div>
                <div className="text-3xl font-bold text-green-500">
                  {screenTimeMetrics?.conversionRate.toFixed(0) || 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {screenTimeMetrics?.improved || 0} jongeren naar actieve hobby
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Gem. Interventieduur</div>
                <div className="text-3xl font-bold">{screenTimeMetrics?.avgInterventionDays || 0} dagen</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Van eerste gesprek tot actie
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="font-medium">Meetbare Gedragsverandering</p>
                  <p className="text-sm text-muted-foreground">
                    {screenTimeMetrics?.improved || 0} jongeren zijn succesvol overgestapt van passieve schermtijd naar actieve bezigheden 
                    zoals sport, muziek of sociale activiteiten. Dit draagt bij aan betere fysieke en mentale gezondheid.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="font-medium">Actie-gedreven Ondersteuning</p>
                  <p className="text-sm text-muted-foreground">
                    Gemiddeld {screenTimeMetrics?.avgActionsCompleted.toFixed(1) || 0} acties voltooid per interventie. 
                    Matti helpt jongeren niet alleen met praten, maar ook met concrete stappen naar verandering.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">ROI voor Gemeentes</p>
                  <p className="text-sm text-muted-foreground">
                    {behaviorROI?.totalSuccessful || 0} succesvolle interventies voorkomen geschatte 
                    €{Math.round((behaviorROI?.totalCostAvoidance || 0) / 1000)}k aan toekomstige zorgkosten 
                    door vroege preventie en gedragsverandering.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Vermeden Kosten per Zorgtype</CardTitle>
            <CardDescription>
              Gedetailleerde breakdown van voorkomen zorgtrajecten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {costAvoidance && costAvoidance.breakdown.length > 0 ? (
              <div className="space-y-4">
                {costAvoidance.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{item.careType}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.count} voorkomen trajecten × €{item.costPerCase.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">
                        €{Math.round(item.totalCost / 1000)}k
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="font-bold text-lg">Totaal Vermeden Kosten</div>
                  <div className="text-3xl font-bold text-green-500">
                    €{Math.round(costAvoidance.totalAvoidedCost / 1000)}k
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nog geen kostendata beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Belangrijkste Inzichten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Preventieve Impact</p>
                  <p className="text-sm text-muted-foreground">
                    {escalationPrevention?.preventionRate.toFixed(0) || 0}% van hoog-risico gebruikers stabiliseerde zonder doorverwijzing naar specialistische zorg.
                    Dit voorkomt langdurige wachtlijsten en hogere zorgkosten.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Meetbare Verbetering</p>
                  <p className="text-sm text-muted-foreground">
                    Gebruikers rapporteren gemiddeld {improvementStats?.averageImprovement.toFixed(0) || 0}% verbetering na slechts{" "}
                    {improvementStats?.averageConversations.toFixed(1) || 0} gesprekken. Dit toont de effectiviteit van laagdrempelige ondersteuning.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Kosteneffectiviteit</p>
                  <p className="text-sm text-muted-foreground">
                    Elke euro geïnvesteerd in Matti/Opvoedmaatje levert{" "}
                    {roiData[1] && roiData[0] 
                      ? (roiData[1].value / roiData[0].value).toFixed(1)
                      : 0}× return door voorkomen van duurdere zorgtrajecten.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium">Directe Toegankelijkheid</p>
                  <p className="text-sm text-muted-foreground">
                    Gebruikers krijgen direct hulp (0 dagen wachttijd) versus 120 dagen gemiddelde wachttijd voor reguliere jeugdzorg.
                    Dit voorkomt escalatie tijdens wachttijd.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Aanbevelingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="flex-shrink-0 text-lg font-bold text-primary">1.</div>
                <p className="text-sm">
                  <strong>Uitbreiden bereik:</strong> Verhoog bekendheid bij huisartsen en scholen om meer jongeren en ouders vroeg te bereiken.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="flex-shrink-0 text-lg font-bold text-primary">2.</div>
                <p className="text-sm">
                  <strong>Integratie met zorgketen:</strong> Koppel Matti/Opvoedmaatje aan wijkteams en jeugd-GGZ voor naadloze doorverwijzing waar nodig.
                </p>
              </div>

              <div className="flex gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="flex-shrink-0 text-lg font-bold text-primary">3.</div>
                <p className="text-sm">
                  <strong>Continue monitoring:</strong> Blijf verbetering en kosteneffectiviteit meten om funding te onderbouwen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
