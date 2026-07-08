import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { AgeGroupFilter, AgeGroupValue } from "@/components/AgeGroupFilter";
import { SchoolFilter, SchoolValue } from "@/components/SchoolFilter";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MATTI_THEMES, THEME_COLORS, THEME_DESCRIPTIONS } from "../../../shared/themes";
import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Themes() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });

  const [ageGroup, setAgeGroup] = useState<AgeGroupValue>('all');
  // ?school=... in de URL opent het dashboard direct gefilterd op die school
  // (de deelbare link per school van de Scholen-pagina)
  const [school, setSchool] = useState<SchoolValue>(() => {
    try {
      return new URLSearchParams(window.location.search).get("school") || "all";
    } catch {
      return "all";
    }
  });

  const queryDateRange = useMemo(() => ({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
    ageGroup: ageGroup !== 'all' ? ageGroup : undefined,
    school: school !== 'all' ? school : undefined,
  }), [dateRange, ageGroup, school]);

  const { data: themeStats, isLoading: themeStatsLoading } = trpc.themes.getThemeStats.useQuery(queryDateRange);
  const { data: themesByAge, isLoading: themesByAgeLoading } = trpc.themes.getThemesByAgeGroup.useQuery(queryDateRange);

  const themeFrequencyData = useMemo(() => {
    if (!themeStats) return [];
    return MATTI_THEMES.map(theme => {
      const stat = themeStats.find((s: { theme: string; count: number; avgDuration: number }) => s.theme === theme);
      return {
        name: theme,
        value: stat?.count || 0,
        avgDuration: stat?.avgDuration || 0,
        color: THEME_COLORS[theme],
      };
    }).sort((a, b) => b.value - a.value);
  }, [themeStats]);

  const exportThemeDataToCSV = () => {
    if (!themeStats || !themesByAge) return;

    // Prepare CSV data
    const csvRows = [];
    
    // Header
    csvRows.push(['Thema', 'Aantal Gesprekken', 'Gemiddelde Duur (min)', '12-14 jaar', '15-17 jaar', '18-21 jaar']);
    
    // Data rows
    MATTI_THEMES.forEach(theme => {
      const stat = themeStats.find((s: { theme: string; count: number; avgDuration: number }) => s.theme === theme);
      const ageData = themesByAge.filter((item: { theme: string; ageGroup: string; count: number }) => item.theme === theme);
      
      const age12_14 = ageData.find((item: { ageGroup: string; count: number }) => item.ageGroup === '12-14')?.count || 0;
      const age15_17 = ageData.find((item: { ageGroup: string; count: number }) => item.ageGroup === '15-17')?.count || 0;
      const age18_21 = ageData.find((item: { ageGroup: string; count: number }) => item.ageGroup === '18-21')?.count || 0;
      
      csvRows.push([
        theme,
        stat?.count || 0,
        stat?.avgDuration ? Math.round(stat.avgDuration) : 0,
        age12_14,
        age15_17,
        age18_21
      ]);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `matti-themas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const themeAgeDistributionData = useMemo(() => {
    if (!themesByAge) return [];
    
    // Group by theme, then by age group
    const grouped = new Map<string, Record<string, number>>();
    
    themesByAge.forEach((item: { theme: string; ageGroup: string; count: number }) => {
      if (!grouped.has(item.theme)) {
        grouped.set(item.theme, {});
      }
      const themeData = grouped.get(item.theme)!;
      themeData[item.ageGroup] = item.count;
    });

    // Convert to chart format
    return Array.from(grouped.entries()).map(([theme, ageData]) => ({
      theme,
      '12-14': ageData['12-14'] || 0,
      '15-17': ageData['15-17'] || 0,
      '18-21': ageData['18-21'] || 0,
    }));
  }, [themesByAge]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thema's & Onderwerpen</h1>
            <p className="text-muted-foreground mt-2">
              Analyse van de 9 Matti-thema's waar jongeren over praten
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportThemeDataToCSV()}
              disabled={!themeStats || themeStats.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporteer CSV
            </Button>
            <SchoolFilter value={school} onChange={setSchool} />
            <AgeGroupFilter value={ageGroup} onChange={setAgeGroup} />
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Theme Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {MATTI_THEMES.slice(0, 3).map((theme) => {
            const stat = themeStats?.find((s: { theme: string; count: number; avgDuration: number }) => s.theme === theme);
            return (
              <Card key={theme}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg" style={{ color: THEME_COLORS[theme] }}>
                      {theme}
                    </CardTitle>
                    <div 
                      className="w-3 h-3 rounded-full mt-1" 
                      style={{ backgroundColor: THEME_COLORS[theme] }}
                    />
                  </div>
                  <CardDescription className="text-xs">
                    {THEME_DESCRIPTIONS[theme]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gesprekken</span>
                      <span className="text-2xl font-bold">{stat?.count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gem. duur</span>
                      <span className="text-sm font-medium">{stat?.avgDuration ? `${Math.round(stat.avgDuration)} min` : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Theme Frequency Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Thema Frequentie</CardTitle>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>
              Aantal gesprekken per thema (alle 9 Matti-thema's)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {themeStatsLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
              </div>
            ) : themeFrequencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={themeFrequencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'value') return [value, 'Gesprekken'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Aantal gesprekken">
                    {themeFrequencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Geen gegevens beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Distribution by Age Group */}
        <Card>
          <CardHeader>
            <CardTitle>Thema's per Leeftijdsgroep</CardTitle>
            <CardDescription>
              Welke thema's bespreken verschillende leeftijdsgroepen?
            </CardDescription>
          </CardHeader>
          <CardContent>
            {themesByAgeLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
              </div>
            ) : themeAgeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={themeAgeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="theme" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="12-14" stackId="a" fill="#3b82f6" name="12-14 jaar" />
                  <Bar dataKey="15-17" stackId="a" fill="#10b981" name="15-17 jaar" />
                  <Bar dataKey="18-21" stackId="a" fill="#f59e0b" name="18-21 jaar" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Geen gegevens beschikbaar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sub-themes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sub-thema's: Pesten</CardTitle>
            <CardDescription>
              Pesten komt voor onder meerdere hoofdthema's (School, Vrienden, Gevoelens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Pesten (algemeen)</h4>
                  <span className="text-sm text-muted-foreground">Komt voor in: School, Vrienden, Gevoelens</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tracking voor pesten wordt geïmplementeerd zodra de Matti app deze sub-thema's gaat detecteren
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Pesten (online/cyberpesten)</h4>
                  <span className="text-sm text-muted-foreground">Komt voor in: School, Vrienden, Gevoelens</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tracking voor cyberpesten wordt geïmplementeerd zodra de Matti app deze sub-thema's gaat detecteren
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
