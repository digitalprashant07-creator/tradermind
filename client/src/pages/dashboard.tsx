import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Flame,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Trade, MoneyTransaction } from "@shared/schema";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  testId,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-xl font-mono font-semibold ${
              trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : ""
            }`}>
              {value}
            </p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
            trend === "up" ? "bg-profit/10" : trend === "down" ? "bg-loss/10" : "bg-muted"
          }`}>
            <Icon className={`w-4 h-4 ${
              trend === "up" ? "text-profit" : trend === "down" ? "text-loss" : "text-muted-foreground"
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: trades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: transactions } = useQuery<MoneyTransaction[]>({
    queryKey: ["/api/money"],
  });

  const closedTrades = trades?.filter((t) => t.status === "CLOSED") || [];
  const openTrades = trades?.filter((t) => t.status === "OPEN") || [];
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.netPnL || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyInflows = transactions?.filter(
    (t) => t.type === "INFLOW" && t.month === currentMonth && t.year === currentYear
  ).reduce((sum, t) => sum + t.amount, 0) || 0;
  const monthlyOutflows = transactions?.filter(
    (t) => t.type === "OUTFLOW" && t.month === currentMonth && t.year === currentYear
  ).reduce((sum, t) => sum + t.amount, 0) || 0;
  const netCashFlow = monthlyInflows - monthlyOutflows;

  let streak = 0;
  let streakType: "win" | "loss" | "none" = "none";
  const sortedClosed = [...closedTrades].sort(
    (a, b) => new Date(b.exitDate || "").getTime() - new Date(a.exitDate || "").getTime()
  );
  if (sortedClosed.length > 0) {
    streakType = (sortedClosed[0].netPnL || 0) > 0 ? "win" : "loss";
    for (const trade of sortedClosed) {
      const isWin = (trade.netPnL || 0) > 0;
      if ((streakType === "win" && isWin) || (streakType === "loss" && !isWin)) {
        streak++;
      } else {
        break;
      }
    }
  }

  if (tradesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your trading performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total P&L"
          value={`${totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}`}
          subtitle={`${closedTrades.length} closed trades`}
          icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
          trend={totalPnL >= 0 ? "up" : "down"}
          testId="card-total-pnl"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`${winningTrades.length}W / ${closedTrades.length - winningTrades.length}L`}
          icon={Target}
          trend={winRate >= 50 ? "up" : winRate > 0 ? "down" : "neutral"}
          testId="card-win-rate"
        />
        <StatCard
          title="Open Positions"
          value={`${openTrades.length}`}
          subtitle="Active trades"
          icon={Activity}
          trend="neutral"
          testId="card-open-positions"
        />
        <StatCard
          title={`${streakType === "win" ? "Win" : streakType === "loss" ? "Loss" : ""} Streak`}
          value={`${streak}`}
          subtitle={streak > 0 ? `${streakType === "win" ? "Consecutive wins" : "Consecutive losses"}` : "No streak"}
          icon={Flame}
          trend={streakType === "win" ? "up" : streakType === "loss" ? "down" : "neutral"}
          testId="card-streak"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" data-testid="card-recent-trades">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {closedTrades.length === 0 && openTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trades yet. Start by adding your first trade.
              </p>
            ) : (
              <div className="space-y-2">
                {[...openTrades, ...closedTrades].slice(0, 5).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/30"
                    data-testid={`trade-row-${trade.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        trade.status === "OPEN" ? "bg-chart-4" : (trade.netPnL || 0) >= 0 ? "bg-profit" : "bg-loss"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-mono">{trade.symbol}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">
                            {trade.tradeType}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {trade.positionType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {trade.status === "CLOSED" ? (
                        <p className={`text-sm font-mono font-medium ${
                          (trade.netPnL || 0) >= 0 ? "text-profit" : "text-loss"
                        }`}>
                          {(trade.netPnL || 0) >= 0 ? "+" : ""}
                          {(trade.netPnL || 0).toLocaleString("en-IN")}
                        </p>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">OPEN</Badge>
                      )}
                      <p className="text-[10px] text-muted-foreground">{trade.entryDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card data-testid="card-cash-flow">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Monthly Cash Flow</p>
              <p className={`text-lg font-mono font-semibold ${
                netCashFlow >= 0 ? "text-profit" : "text-loss"
              }`}>
                {netCashFlow >= 0 ? "+" : ""}{netCashFlow.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="w-3 h-3 text-profit" />
                  <span className="text-muted-foreground">In:</span>
                  <span className="font-mono text-profit">{monthlyInflows.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <ArrowDownRight className="w-3 h-3 text-loss" />
                  <span className="text-muted-foreground">Out:</span>
                  <span className="font-mono text-loss">{monthlyOutflows.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
