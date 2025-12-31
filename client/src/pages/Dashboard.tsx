import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, TrendingUp, Users } from "lucide-react";
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

  const stats = useMemo(() => {
    if (!summary) return [];

    return [
      {
        title: "Totaal Gebeurtenissen",
        value: summary.totalEvents?.toLocaleString() ?? "0",
        description: "Geregistreerde analytics gebeurtenissen",
        icon: Activity,
        trend: null,
      },
      {
        title: "Unieke Gebruikers",
        value: summary.uniqueUsers?.toLocaleString() ?? "0",
        description: "Gebaseerd op postcodegebieden",
        icon: Users,
        trend: null,
      },
      {
        title: "Terugkerende Gebruikers",
        value: `${typeof summary.returningUserRate === 'number' ? summary.returningUserRate.toFixed(1) : "0"}%`,
        description: "Gebruikersbehoudpercentage",
        icon: TrendingUp,
        trend: null,
      },
      {
        title: "Hoog Risico Gebruikers",
        value: summary.highRiskCount?.toLocaleString() ?? "0",
        description: "Gebruikers met 3+ thema's",
        icon: AlertTriangle,
        trend: null,
      },
    ];
  }, [summary]);

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


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
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
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
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
