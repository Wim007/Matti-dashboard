import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { trpc } from "@/lib/trpc";
import { Activity, MessageSquare, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Engagement() {
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

  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sessionDuration, isLoading: sessionLoading } = trpc.engagement.sessionDuration.useQuery(queryDateRange);
  const { data: messageCount, isLoading: messageLoading } = trpc.engagement.messageCount.useQuery(queryDateRange);
  const { data: summary } = trpc.analytics.getSummary.useQuery(queryDateRange);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.engagement.sessionDuration.invalidate(),
        utils.engagement.messageCount.invalidate(),
        utils.analytics.getSummary.invalidate(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sessionData = useMemo(() => {
    if (!sessionDuration) return [];
    return sessionDuration.map((item) => ({
      date: new Date(item.date).toLocaleDateString("nl-NL", { month: "short", day: "numeric" }),
      avgDuration: Number(item.avgDuration) / 60, // Convert to minutes
      count: Number(item.count),
    }));
  }, [sessionDuration]);

  const messageData = useMemo(() => {
    if (!messageCount) return [];
    return messageCount.map((item) => ({
      date: new Date(item.date).toLocaleDateString("nl-NL", { month: "short", day: "numeric" }),
      avgMessages: Number(item.avgMessages),
      count: Number(item.count),
    }));
  }, [messageCount]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gebruikersbetrokkenheid</h1>
            <p className="text-muted-foreground mt-2">
              Sessieduur, aantal berichten en gebruikersinteractiepatronen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Ververs Data
            </Button>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gem. Sessieduur</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((summary?.avgSessionDuration ?? 0) / 60)} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gemiddelde tijd per sessie</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gem. Berichten</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof summary?.avgMessageCount === 'number' ? summary.avgMessageCount.toFixed(1) : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Berichten per sessie</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Sessies</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary?.totalEvents?.toLocaleString() ?? "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In geselecteerde periode</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sessieduur Trend</CardTitle>
            <CardDescription>Gemiddelde sessieduur over tijd (minuten)</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
              </div>
            ) : sessionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={sessionData}>
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} min`, "Gem. Duur"]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorDuration)"
                    name="Gem. Duur (min)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Geen gegevens beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aantal Berichten Trend</CardTitle>
            <CardDescription>Gemiddeld aantal berichten per sessie over tijd</CardDescription>
          </CardHeader>
          <CardContent>
            {messageLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
              </div>
            ) : messageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={messageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}`, "Gem. Berichten"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgMessages"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="Gem. Berichten"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Geen gegevens beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sessie Volume</CardTitle>
              <CardDescription>Aantal sessies per dag</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Laden...</div>
                </div>
              ) : sessionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sessionData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name="Sessies"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Geen gegevens beschikbaar
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Betrokkenheidskwaliteit</CardTitle>
              <CardDescription>Belangrijke betrokkenheidsindicatoren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Terugkeerpercentage</span>
                <span className="text-2xl font-semibold">
                  {typeof summary?.returningUserRate === 'number' ? summary.returningUserRate.toFixed(1) : "0"}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tevredenheidsscore</span>
                <span className="text-2xl font-semibold">
                  {typeof summary?.avgSatisfactionScore === 'number' ? summary.avgSatisfactionScore.toFixed(1) : "N/A"} / 10
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Zelfgerapporteerde Verbetering</span>
                <span className="text-2xl font-semibold text-green-500">
                  {typeof summary?.improvementRate === 'number' ? summary.improvementRate.toFixed(1) : "0"}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
