import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, TrendingUp, Users, Euro, TrendingDown, Clock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });

  const queryDateRange = useMemo(() => ({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
  }), [dateRange]);

  const { data: summary, isLoading } = trpc.analytics.getSummary.useQuery(queryDateRange);
  const { data: costAvoidance } = trpc.funding.getCostAvoidance.useQuery(queryDateRange);
  const { data: escalationPrevention } = trpc.funding.getEscalationPrevention.useQuery(queryDateRange);
  const { data: improvement } = trpc.funding.getImprovementStats.useQuery(queryDateRange);

  const stats = useMemo(() => {
    if (!summary) return [];

    return [
      {
        title: "Totaal Gebeurtenissen",
        value: summary.totalEvents?.toLocaleString() ?? "0",
        description: "Geregistreerde analytics gebeurtenissen",
        icon: Activity,
        tooltip: "Totaal aantal geregistreerde gesprekken en interacties in de geselecteerde periode",
        color: "text-blue-500",
      },
      {
        title: "Unieke Gebruikers",
        value: summary.uniqueUsers?.toLocaleString() ?? "0",
        description: "Gebaseerd op postcodegebieden",
        icon: Users,
        tooltip: "Aantal unieke gebruikers op basis van geanonimiseerde postcodegebieden (eerste 4 cijfers)",
        color: "text-purple-500",
      },
      {
        title: "Vermeden Zorgkosten",
        value: costAvoidance ? `€${(costAvoidance.totalAvoidedCost / 1000).toFixed(0)}k` : "€0",
        description: "Geschatte besparing deze periode",
        icon: Euro,
        tooltip: `Berekend op basis van voorkomen trajecten: Jeugd-GGZ (€8k), Specialistische zorg (€15k), Uithuisplaatsing (€50k), Veilig Thuis (€5k)`,
        color: "text-green-500",
      },
      {
        title: "Escalatie Voorkomen",
        value: escalationPrevention ? `${escalationPrevention.preventionRate}%` : "0%",
        description: "Hoog-risico gebruikers gestabiliseerd",
        icon: TrendingDown,
        tooltip: `${escalationPrevention?.stabilizedUsers ?? 0} van ${escalationPrevention?.highRiskUsers ?? 0} hoog-risico gebruikers (3+ thema's) stabiliseerden zonder doorverwijzing naar specialistische zorg`,
        color: "text-orange-500",
      },
      {
        title: "Snelheid Hulp",
        value: "0 dagen",
        description: "120 dagen sneller dan reguliere zorg",
        icon: Clock,
        tooltip: "Directe app-toegang (0 dagen wachttijd) vs. reguliere jeugdzorg wachtlijst (gemiddeld 120 dagen)",
        color: "text-cyan-500",
      },
      {
        title: "Verbetering na Gesprekken",
        value: improvement && improvement.totalMeasurements > 0 ? `${improvement.averageImprovement.toFixed(0)}%` : "N/A",
        description: improvement && improvement.totalMeasurements > 0 ? `Gemiddeld na ${improvement.averageConversations.toFixed(1)} gesprekken` : "Nog geen data",
        icon: TrendingUp,
        tooltip: improvement && improvement.totalMeasurements > 0 
          ? `Gemiddelde verbetering op 1-10 schaal, gebaseerd op ${improvement.totalMeasurements} metingen. Meest verbeterd: ${improvement.byTheme[0]?.theme ?? 'N/A'} (${improvement.byTheme[0]?.improvement.toFixed(0) ?? 0}%)`
          : "Verbetering wordt gemeten door gebruikers te vragen hun ervaring te scoren op een schaal van 1-10, zowel bij het eerste gesprek als bij vervolgcontacten",
        color: "text-green-500",
      },
    ];
  }, [summary, costAvoidance, escalationPrevention, improvement]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor geanonimiseerde gebruiksgegevens van Matti en Opvoedmaatje gezinsondersteuning apps
            </p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>


        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Laden...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{stat.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TooltipProvider>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Betrokkenheidsstatistieken</CardTitle>
              <CardDescription>Gemiddelde sessie- en interactiegegevens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gem. Sessieduur</span>
                    <span className="text-lg font-semibold">
                      {Math.round((summary?.avgSessionDuration ?? 0) / 60)} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gem. Berichten per Sessie</span>
                    <span className="text-lg font-semibold">
                      {typeof summary?.avgMessageCount === 'number' ? summary.avgMessageCount.toFixed(1) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tevredenheidsscore</span>
                    <span className="text-lg font-semibold">
                      {typeof summary?.avgSatisfactionScore === 'number' ? summary.avgSatisfactionScore.toFixed(1) : "N/A"} / 10
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risicobeoordeling</CardTitle>
              <CardDescription>Veiligheids- en interventiemetingen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Veiligheidssignalen</span>
                    <span className="text-lg font-semibold text-destructive">
                      {summary?.safetySignalCount?.toLocaleString() ?? "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Hoog Risico Gebruikers</span>
                    <span className="text-lg font-semibold text-yellow-500">
                      {summary?.highRiskCount?.toLocaleString() ?? "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Zelfgerapporteerde Verbetering</span>
                    <span className="text-lg font-semibold text-green-500">
                      {typeof summary?.improvementRate === 'number' ? summary.improvementRate.toFixed(1) : "0"}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
