import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, MessageSquare, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Engagement() {
  const [dateRange] = useState(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  }));

  const { data: sessionDuration, isLoading: sessionLoading } = trpc.engagement.sessionDuration.useQuery(dateRange);
  const { data: messageCount, isLoading: messageLoading } = trpc.engagement.messageCount.useQuery(dateRange);
  const { data: summary } = trpc.analytics.getSummary.useQuery(dateRange);

  const sessionData = useMemo(() => {
    if (!sessionDuration) return [];
    return sessionDuration.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgDuration: Number(item.avgDuration) / 60, // Convert to minutes
      count: Number(item.count),
    }));
  }, [sessionDuration]);

  const messageData = useMemo(() => {
    if (!messageCount) return [];
    return messageCount.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgMessages: Number(item.avgMessages),
      count: Number(item.count),
    }));
  }, [messageCount]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Engagement</h1>
          <p className="text-muted-foreground mt-2">
            Session duration, message counts, and user interaction patterns
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((summary?.avgSessionDuration ?? 0) / 60)} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average time per session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary?.avgMessageCount?.toFixed(1) ?? "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Messages per session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary?.totalEvents?.toLocaleString() ?? "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In selected period</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Duration Trend</CardTitle>
            <CardDescription>Average session duration over time (minutes)</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                    formatter={(value: number) => [`${value.toFixed(1)} min`, "Avg. Duration"]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorDuration)"
                    name="Avg. Duration (min)"
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

        <Card>
          <CardHeader>
            <CardTitle>Message Count Trend</CardTitle>
            <CardDescription>Average messages per session over time</CardDescription>
          </CardHeader>
          <CardContent>
            {messageLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                    formatter={(value: number) => [`${value.toFixed(1)}`, "Avg. Messages"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgMessages"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="Avg. Messages"
                  />
                </LineChart>
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
              <CardTitle>Session Volume</CardTitle>
              <CardDescription>Number of sessions per day</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                      name="Sessions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Quality</CardTitle>
              <CardDescription>Key engagement indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Returning User Rate</span>
                <span className="text-2xl font-semibold">
                  {summary?.returningUserRate?.toFixed(1) ?? "0"}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Satisfaction Score</span>
                <span className="text-2xl font-semibold">
                  {summary?.avgSatisfactionScore?.toFixed(1) ?? "N/A"} / 10
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Self-Reported Improvement</span>
                <span className="text-2xl font-semibold text-green-500">
                  {summary?.improvementRate?.toFixed(1) ?? "0"}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
