import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function Demographics() {
  const [dateRange] = useState(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  }));

  const { data: ageGroups, isLoading: ageLoading } = trpc.demographics.ageGroups.useQuery(dateRange);
  const { data: postalCodes, isLoading: postalLoading } = trpc.demographics.postalCodes.useQuery(dateRange);
  const { data: userTypes, isLoading: userTypesLoading } = trpc.demographics.userTypes.useQuery(dateRange);
  const { data: familyTypes, isLoading: familyTypesLoading } = trpc.demographics.familyTypes.useQuery(dateRange);
  const { data: themes, isLoading: themesLoading } = trpc.demographics.themes.useQuery(dateRange);

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

  const familyTypeData = useMemo(() => {
    if (!familyTypes) return [];
    const labels: Record<string, string> = {
      eenouder: "Eenouder",
      tweeouder: "Tweeouder",
      samengesteld: "Samengesteld",
    };
    return familyTypes.map((item) => ({
      name: labels[item.familyType || ""] || item.familyType,
      value: Number(item.count),
    }));
  }, [familyTypes]);

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demografie</h1>
          <p className="text-muted-foreground mt-2">
            Gebruikersdemografie en verdelingsanalyse
          </p>
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
              <CardTitle>Gebruikerstype Verdeling</CardTitle>
              <CardDescription>Jongere vs Ouder</CardDescription>
            </CardHeader>
            <CardContent>
              {userTypesLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Laden...</div>
                </div>
              ) : userTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userTypeData.map((_, index) => (
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
              <CardTitle>Gezinstype Verdeling</CardTitle>
              <CardDescription>Voor oudergebruikers</CardDescription>
            </CardHeader>
            <CardContent>
              {familyTypesLoading ? (
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
                <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
