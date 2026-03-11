import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  X,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import type { MoneyTransaction } from "@shared/schema";

const incomeCategories = ["Trading Profit", "Salary", "Freelance", "Dividends", "Rental Income", "Business", "Other"];
const expenseCategories = ["Brokerage & Charges", "Rent", "Food", "EMI", "Utilities", "Subscriptions", "Education", "Travel", "Healthcare", "Entertainment", "Other"];
const paymentModes = ["Bank Transfer", "UPI", "Cash", "Card", "Cheque"];
const COLORS = ["hsl(166,100%,42%)", "hsl(222,100%,65%)", "hsl(264,100%,67%)", "hsl(43,74%,49%)", "hsl(355,100%,64%)", "hsl(200,80%,50%)", "hsl(30,90%,55%)"];

function AddTransactionDialog({ open, onOpenChange, type }: { open: boolean; onOpenChange: (o: boolean) => void; type: "INFLOW" | "OUTFLOW" }) {
  const { toast } = useToast();
  const categories = type === "INFLOW" ? incomeCategories : expenseCategories;
  const today = new Date();

  const [form, setForm] = useState({
    category: categories[0],
    amount: "",
    date: today.toISOString().split("T")[0],
    description: "",
    paymentMode: "UPI",
    isRecurring: false,
    tags: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/money", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/money"] });
      toast({ title: `${type === "INFLOW" ? "Income" : "Expense"} added` });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = new Date(form.date);
    createMutation.mutate({
      type,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      description: form.description || null,
      paymentMode: form.paymentMode,
      isRecurring: form.isRecurring,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add {type === "INFLOW" ? "Income" : "Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required data-testid="input-money-amount" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger data-testid="select-money-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="input-money-date" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Mode</Label>
            <Select value={form.paymentMode} onValueChange={(v) => setForm({ ...form, paymentMode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentModes.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none" placeholder="Details..." data-testid="input-money-description" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isRecurring} onCheckedChange={(c) => setForm({ ...form, isRecurring: c })} />
            <Label className="text-xs">Recurring monthly</Label>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-money">
            {createMutation.isPending ? "Adding..." : `Add ${type === "INFLOW" ? "Income" : "Expense"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MoneyPage() {
  const [addType, setAddType] = useState<"INFLOW" | "OUTFLOW" | null>(null);
  const [tab, setTab] = useState("overview");
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<MoneyTransaction[]>({
    queryKey: ["/api/money"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/money/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/money"] });
      toast({ title: "Transaction deleted" });
    },
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const allInflows = transactions?.filter((t) => t.type === "INFLOW") || [];
  const allOutflows = transactions?.filter((t) => t.type === "OUTFLOW") || [];
  const monthInflows = allInflows.filter((t) => t.month === currentMonth && t.year === currentYear);
  const monthOutflows = allOutflows.filter((t) => t.month === currentMonth && t.year === currentYear);
  const totalInflows = allInflows.reduce((s, t) => s + t.amount, 0);
  const totalOutflows = allOutflows.reduce((s, t) => s + t.amount, 0);
  const monthlyIncome = monthInflows.reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthOutflows.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalInflows - totalOutflows;
  const netMonthly = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  const expenseByCat: Record<string, number> = {};
  monthOutflows.forEach((t) => {
    expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount;
  });
  const expensePieData = Object.entries(expenseByCat).map(([name, value]) => ({ name, value: Math.round(value) }));

  const incomeByCat: Record<string, number> = {};
  monthInflows.forEach((t) => {
    incomeByCat[t.category] = (incomeByCat[t.category] || 0) + t.amount;
  });
  const incomePieData = Object.entries(incomeByCat).map(([name, value]) => ({ name, value: Math.round(value) }));

  const monthlyBarData: { month: string; income: number; expenses: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const mi = allInflows.filter((t) => t.month === m && t.year === currentYear).reduce((s, t) => s + t.amount, 0);
    const me = allOutflows.filter((t) => t.month === m && t.year === currentYear).reduce((s, t) => s + t.amount, 0);
    if (mi > 0 || me > 0) {
      monthlyBarData.push({
        month: new Date(currentYear, m - 1).toLocaleString("default", { month: "short" }),
        income: Math.round(mi),
        expenses: Math.round(me),
      });
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-money-title">Money Management</h1>
          <p className="text-sm text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setAddType("INFLOW")} data-testid="button-add-income">
            <ArrowUpRight className="w-4 h-4 mr-1" /> Income
          </Button>
          <Button variant="secondary" onClick={() => setAddType("OUTFLOW")} data-testid="button-add-expense">
            <ArrowDownRight className="w-4 h-4 mr-1" /> Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card data-testid="card-net-monthly">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Cash Flow (Month)</p>
            <p className={`text-lg font-mono font-semibold ${netMonthly >= 0 ? "text-profit" : "text-loss"}`}>
              {netMonthly >= 0 ? "+" : ""}{netMonthly.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-net-balance">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Balance</p>
            <p className={`text-lg font-mono font-semibold ${netBalance >= 0 ? "text-profit" : "text-loss"}`}>
              {netBalance >= 0 ? "+" : ""}{netBalance.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-savings-rate">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Savings Rate</p>
            <p className={`text-lg font-mono font-semibold ${savingsRate >= 0 ? "text-profit" : "text-loss"}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-monthly-income">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Income</p>
            <p className="text-lg font-mono font-semibold text-profit">
              {monthlyIncome.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-money-overview">Overview</TabsTrigger>
          <TabsTrigger value="income" data-testid="tab-money-income">Income</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-money-expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="chart-monthly-income-expenses">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyBarData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,16%,19%)" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(240,10%,58%)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(240,15%,10%)", border: "1px solid hsl(240,16%,19%)", borderRadius: 6 }} />
                      <Bar dataKey="income" fill="hsl(166,100%,42%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="hsl(355,100%,64%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card data-testid="chart-expense-breakdown">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {expensePieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No expenses this month</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name }) => name}>
                        {expensePieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(240,15%,10%)", border: "1px solid hsl(240,16%,19%)", borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-3 mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Total: <span className="font-mono text-profit">{monthlyIncome.toLocaleString("en-IN")}</span></p>
            <Button size="sm" onClick={() => setAddType("INFLOW")} data-testid="button-add-income-tab">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          {allInflows.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">No income entries</p></CardContent></Card>
          ) : (
            allInflows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
              <Card key={t.id} data-testid={`card-income-${t.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{t.category}</span>
                        <Badge variant="secondary" className="text-[10px]">{t.paymentMode}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-mono text-profit">+{t.amount.toLocaleString("en-IN")}</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-3 mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm text-muted-foreground">Total: <span className="font-mono text-loss">{monthlyExpenses.toLocaleString("en-IN")}</span></p>
            <Button size="sm" onClick={() => setAddType("OUTFLOW")} data-testid="button-add-expense-tab">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          {allOutflows.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">No expense entries</p></CardContent></Card>
          ) : (
            allOutflows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
              <Card key={t.id} data-testid={`card-expense-${t.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{t.category}</span>
                        <Badge variant="secondary" className="text-[10px]">{t.paymentMode}</Badge>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-mono text-loss">-{t.amount.toLocaleString("en-IN")}</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {addType && (
        <AddTransactionDialog open={!!addType} onOpenChange={(o) => !o && setAddType(null)} type={addType} />
      )}
    </div>
  );
}
