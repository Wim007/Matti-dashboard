import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRangeValue } from "@/components/DateRangeFilter";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function Demographics() {
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

  const { data: ageGroups, isLoading: ageLoading } = trpc.demographics.ageGroups.useQuery(queryDateRange);
  const { data: postalCodes, isLoading: postalLoading } = trpc.demographics.postalCodes.useQuery(queryDateRange);
  const { data: userTypes, isLoading: userTypesLoading } = trpc.demographics.userTypes.useQuery(queryDateRange);
  const { data: familyTypes, isLoading: familyTypesLoading } = trpc.demographics.familyTypes.useQuery(queryDateRange);
  const { data: themes, isLoading: themesLoading } = trpc.demographics.themes.useQuery(queryDateRange);

  const ageGroupData = useMemo(() => {
    if (!ageGroups) return [];
    return ageGroups.map((item) => ({
      name: item.ageGroup,
      value: Number(item.count),
    }));
  }, [ageGroups]);

  const postalCodeData = useMemo(() => {
    if (!postalCodes) return [];
    return postalCodes.map((item) => ({
      name: item.postalCodeArea,
      value: Number(item.count),
    }));
  }, [postalCodes]);

  const userTypeData = useMemo(() => {
    if (!userTypes) return [];
    return userTypes.map((item) => ({
      name: item.userType === "jongere" ? "Jongere" : "Ouder",
      value: Number(item.count),
    }));
  }, [userTypes]);

  // Filter themes related to parents/family
  const parentRelatedThemes = useMemo(() => {
    if (!themes) return [];
    const parentKeywords = ['ouder', 'thuis', 'gezin', 'familie', 'moeder', 'vader', 'broer', 'zus'];
    return themes
      .filter(item => parentKeywords.some(keyword => item.theme.toLowerCase().includes(keyword)))
      .slice(0, 5)
      .map((item) => ({
        name: item.theme,
        value: item.count,
      }));
  }, [themes]);

  const familyTypeData = parentRelatedThemes;

  const themeData = useMemo(() => {
    if (!themes) return [];
    return themes.slice(0, 10).map((item) => ({
      name: item.theme,
      value: item.count,
    }));
  }, [themes]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demografie</h1>
            <p className="text-muted-foreground mt-2">
              Gebruikersdemografie en verdelingsanalyse
            </p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Leeftijdsgroep Verdeling</CardTitle>
              <CardDescription>Gebruikers per leeftijdsgroep</CardDescription>
            </CardHeader>
            <CardContent>
              {ageLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Laden...</div>
                </div>
              ) : ageGroupData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ageGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ageGroupData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
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
              <CardTitle>Nieuwe vs Terugkerende Gebruikers</CardTitle>
              <CardDescription>Gebruikersbetrokkenheid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-muted-foreground">Functionaliteit in ontwikkeling</div>
                  <div className="text-sm text-muted-foreground/70">Data wordt verzameld zodra tracking geïmplementeerd is</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wat jongeren over ouders zeggen</CardTitle>
              <CardDescription>Thema's over ouders en gezin</CardDescription>
            </CardHeader>
            <CardContent>
              {themesLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Laden...</div>
                </div>
              ) : familyTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={familyTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
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
              <CardTitle>Top Postcodegebieden</CardTitle>
              <CardDescription>Geografische verspreiding (top 20)</CardDescription>
            </CardHeader>
            <CardContent>
              {postalLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Laden...</div>
                </div>
              ) : postalCodeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={postalCodeData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Geen gegevens beschikbaar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thema Frequentie Analyse</CardTitle>
            <CardDescription>Top 10 meest besproken thema's</CardDescription>
          </CardHeader>
          <CardContent>
            {themesLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
              </div>
            ) : themeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={themeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" name="Voorkomens" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Geen gegevens beschikbaar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
