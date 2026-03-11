import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { Trade } from "@shared/schema";

const COLORS = ["hsl(166,100%,42%)", "hsl(222,100%,65%)", "hsl(264,100%,67%)", "hsl(43,74%,49%)", "hsl(355,100%,64%)"];

export default function AnalyticsPage() {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const closedTrades = trades?.filter((t) => t.status === "CLOSED") || [];

  const totalPnL = closedTrades.reduce((s, t) => s + (t.netPnL || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.netPnL || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.netPnL || 0) <= 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + (t.netPnL || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + (t.netPnL || 0), 0) / losingTrades.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  const bestTrade = closedTrades.length > 0 ? closedTrades.reduce((best, t) => (t.netPnL || 0) > (best.netPnL || 0) ? t : best, closedTrades[0]) : null;
  const worstTrade = closedTrades.length > 0 ? closedTrades.reduce((worst, t) => (t.netPnL || 0) < (worst.netPnL || 0) ? t : worst, closedTrades[0]) : null;

  const monthlyData: Record<string, { month: string; pnl: number; trades: number; wins: number }> = {};
  closedTrades.forEach((t) => {
    const d = t.exitDate || t.entryDate;
    const month = d.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { month, pnl: 0, trades: 0, wins: 0 };
    monthlyData[month].pnl += t.netPnL || 0;
    monthlyData[month].trades++;
    if ((t.netPnL || 0) > 0) monthlyData[month].wins++;
  });
  const monthlyChartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  const symbolData: Record<string, number> = {};
  closedTrades.forEach((t) => {
    symbolData[t.symbol] = (symbolData[t.symbol] || 0) + (t.netPnL || 0);
  });
  const symbolChartData = Object.entries(symbolData)
    .map(([symbol, pnl]) => ({ symbol, pnl: Math.round(pnl) }))
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 10);

  const fnoTrades = closedTrades.filter((t) => t.tradeType === "FNO");
  const swingTrades = closedTrades.filter((t) => t.tradeType === "SWING");
  const typeCompare = [
    {
      type: "F&O",
      pnl: fnoTrades.reduce((s, t) => s + (t.netPnL || 0), 0),
      trades: fnoTrades.length,
      winRate: fnoTrades.length > 0 ? (fnoTrades.filter((t) => (t.netPnL || 0) > 0).length / fnoTrades.length) * 100 : 0,
    },
    {
      type: "Swing",
      pnl: swingTrades.reduce((s, t) => s + (t.netPnL || 0), 0),
      trades: swingTrades.length,
      winRate: swingTrades.length > 0 ? (swingTrades.filter((t) => (t.netPnL || 0) > 0).length / swingTrades.length) * 100 : 0,
    },
  ];

  const pieData = [
    { name: "Wins", value: winningTrades.length },
    { name: "Losses", value: losingTrades.length },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-analytics-title">Analytics</h1>
        <p className="text-sm text-muted-foreground">Your trading performance breakdown</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card data-testid="stat-total-pnl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-lg font-mono font-semibold ${totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
              {totalPnL >= 0 ? "+" : ""}{totalPnL.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="stat-win-rate">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-mono font-semibold">{winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-profit-factor">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Profit Factor</p>
            <p className="text-lg font-mono font-semibold">{profitFactor.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-trades">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-lg font-mono font-semibold">{closedTrades.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" data-testid="chart-monthly-pnl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly P&L</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No closed trades yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,16%,19%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(240,15%,10%)", border: "1px solid hsl(240,16%,19%)", borderRadius: 6 }}
                    labelStyle={{ color: "hsl(240,25%,93%)" }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "hsl(166,100%,42%)" : "hsl(355,100%,64%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-win-loss-pie">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win / Loss</CardTitle>
          </CardHeader>
          <CardContent>
            {closedTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No data</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      <Cell fill="hsl(166,100%,42%)" />
                      <Cell fill="hsl(355,100%,64%)" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(240,15%,10%)", border: "1px solid hsl(240,16%,19%)", borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-profit" />
                    <span>Wins ({winningTrades.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-loss" />
                    <span>Losses ({losingTrades.length})</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="chart-symbol-pnl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">P&L by Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            {symbolChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={symbolChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,16%,19%)" />
                  <XAxis type="number" tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} />
                  <YAxis dataKey="symbol" type="category" tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(240,15%,10%)", border: "1px solid hsl(240,16%,19%)", borderRadius: 6 }} />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {symbolChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "hsl(166,100%,42%)" : "hsl(355,100%,64%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-type-comparison">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">F&O vs Swing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeCompare.map((tc) => (
                <div key={tc.type} className="p-3 rounded-md bg-muted/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium">{tc.type}</span>
                    <span className={`text-sm font-mono ${tc.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {tc.pnl >= 0 ? "+" : ""}{tc.pnl.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{tc.trades} trades</span>
                    <span>{tc.winRate.toFixed(1)}% win rate</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestTrade && (
          <Card data-testid="card-best-trade">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Best Trade</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-medium">{bestTrade.symbol}</span>
                <span className="text-sm font-mono text-profit">
                  +{(bestTrade.netPnL || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{bestTrade.entryDate}</p>
            </CardContent>
          </Card>
        )}
        {worstTrade && (
          <Card data-testid="card-worst-trade">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Worst Trade</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-medium">{worstTrade.symbol}</span>
                <span className="text-sm font-mono text-loss">
                  {(worstTrade.netPnL || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{worstTrade.entryDate}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
