import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const REFERRAL_COLORS: Record<string, string> = {
  "jeugd-ggz": "#ef4444",
  wijkteam: "#f59e0b",
  huisarts: "#10b981",
  schuldhulp: "#3b82f6",
  "veilig-thuis": "#8b5cf6",
};

export default function RiskAssessment() {
  const [dateRange] = useState(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  }));

  const { data: riskMetrics, isLoading: riskLoading } = trpc.engagement.riskMetrics.useQuery(dateRange);
  const { data: referrals, isLoading: referralsLoading } = trpc.engagement.referrals.useQuery(dateRange);
  const { data: summary } = trpc.analytics.getSummary.useQuery(dateRange);

  const riskTimeSeriesData = useMemo(() => {
    if (!riskMetrics) return [];
    return riskMetrics.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      highRisk: Number(item.highRiskCount),
      safetySignals: Number(item.safetySignalCount),
      total: Number(item.totalCount),
    }));
  }, [riskMetrics]);

  const referralData = useMemo(() => {
    if (!referrals) return [];
    const labels: Record<string, string> = {
      "jeugd-ggz": "Jeugd GGZ",
      wijkteam: "Wijkteam",
      huisarts: "Huisarts",
      schuldhulp: "Schuldhulp",
      "veilig-thuis": "Veilig Thuis",
    };
    return referrals.map((item) => ({
      name: labels[item.referralType || ""] || item.referralType,
      value: Number(item.count),
      avgDays: Number(item.avgDaysToReferral || 0),
      type: item.referralType,
    }));
  }, [referrals]);

  const totalHighRisk = useMemo(() => {
    return riskTimeSeriesData.reduce((sum, item) => sum + item.highRisk, 0);
  }, [riskTimeSeriesData]);

  const totalSafetySignals = useMemo(() => {
    return riskTimeSeriesData.reduce((sum, item) => sum + item.safetySignals, 0);
  }, [riskTimeSeriesData]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Assessment</h1>
          <p className="text-muted-foreground mt-2">
            Monitor high-risk users, safety signals, and referral patterns
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHighRisk.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Users with 3+ themes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Signals</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalSafetySignals.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Urgent intervention needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {summary?.improvementRate?.toFixed(1) ?? "0"}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Self-reported improvement</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Trend Analysis</CardTitle>
            <CardDescription>High-risk users and safety signals over time</CardDescription>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : riskTimeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={riskTimeSeriesData}>
                  <defs>
                    <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSafety" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="highRisk"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorHighRisk)"
                    name="High Risk Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="safetySignals"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSafety)"
                    name="Safety Signals"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral Distribution</CardTitle>
              <CardDescription>Breakdown by referral type</CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : referralData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={referralData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {referralData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REFERRAL_COLORS[entry.type || ""] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No referral data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time to Referral</CardTitle>
              <CardDescription>Average days from first contact to referral</CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : referralData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={referralData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="avgDays" fill="#3b82f6" name="Avg. Days" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No referral data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
