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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, TrendingUp, TrendingDown, Pencil, Calendar, ChevronLeft, ChevronRight, Eye, StickyNote, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Trade } from "@shared/schema";

const emotions = ["CONFIDENT", "FEARFUL", "GREEDY", "DISCIPLINED", "ANXIOUS", "CALM", "FOMO", "REVENGE", "PATIENT"];

interface ChargeBreakdown {
  brokerage: number;
  stt: number;
  exchangeCharge: number;
  sebiCharge: number;
  gst: number;
  stampDuty: number;
  dpCharges: number;
  total: number;
}

function calcZerodhaCharges(
  tradeType: string,
  entryPrice: number,
  quantity: number,
  exitPrice?: number | null
): ChargeBreakdown {
  const buyVal = entryPrice * quantity;
  const sellVal = exitPrice ? exitPrice * quantity : 0;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  if (tradeType === "SWING") {
    const brokerage = 0;
    const stt = r2(buyVal * 0.001 + sellVal * 0.001);
    const exchangeCharge = r2((buyVal + sellVal) * 0.0000297);
    const sebiCharge = r2((buyVal + sellVal) * 0.000001);
    const gst = r2((brokerage + exchangeCharge + sebiCharge) * 0.18);
    const stampDuty = r2(buyVal * 0.00015);
    const dpCharges = exitPrice ? 15.34 : 0;
    const total = r2(brokerage + stt + exchangeCharge + sebiCharge + gst + stampDuty + dpCharges);
    return { brokerage, stt, exchangeCharge, sebiCharge, gst, stampDuty, dpCharges, total };
  } else {
    const brokBuy = Math.min(20, buyVal * 0.0003);
    const brokSell = exitPrice ? Math.min(20, sellVal * 0.0003) : 0;
    const brokerage = r2(brokBuy + brokSell);
    const stt = r2(sellVal * 0.00025);
    const exchangeCharge = r2((buyVal + sellVal) * 0.0000297);
    const sebiCharge = r2((buyVal + sellVal) * 0.000001);
    const gst = r2((brokerage + exchangeCharge + sebiCharge) * 0.18);
    const stampDuty = r2(buyVal * 0.00003);
    const dpCharges = 0;
    const total = r2(brokerage + stt + exchangeCharge + sebiCharge + gst + stampDuty + dpCharges);
    return { brokerage, stt, exchangeCharge, sebiCharge, gst, stampDuty, dpCharges, total };
  }
}

function ChargeBreakdownDisplay({ charges }: { charges: ChargeBreakdown }) {
  if (charges.total === 0) return null;
  const items = [
    { label: "Brokerage", value: charges.brokerage },
    { label: "STT", value: charges.stt },
    { label: "Exchange Txn", value: charges.exchangeCharge },
    { label: "SEBI", value: charges.sebiCharge },
    { label: "GST", value: charges.gst },
    { label: "Stamp Duty", value: charges.stampDuty },
    { label: "DP Charges", value: charges.dpCharges },
  ].filter(i => i.value > 0);

  return (
    <div className="p-2.5 rounded-md bg-muted/30 space-y-1" data-testid="charge-breakdown">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Zerodha Charges</p>
      {items.map(i => (
        <div key={i.label} className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">{i.label}</span>
          <span className="font-mono">{i.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
      <div className="flex justify-between text-xs font-medium border-t pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono">{charges.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}

function AddTradeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    symbol: "",
    tradeType: "SWING",
    positionType: "LONG",
    segment: "EQUITY",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    lotSize: "",
    strikePrice: "",
    optionType: "",
    expiry: "",
    entryDate: new Date().toISOString().split("T")[0],
    exitDate: "",
    charges: "0",
    notes: "",
    emotionEntry: "",
    tags: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/trades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "Trade added successfully" });
      onOpenChange(false);
      setForm({
        symbol: "", tradeType: "SWING", positionType: "LONG", segment: "EQUITY",
        entryPrice: "", exitPrice: "", quantity: "", lotSize: "", strikePrice: "",
        optionType: "", expiry: "", entryDate: new Date().toISOString().split("T")[0],
        exitDate: "", charges: "0", notes: "", emotionEntry: "", tags: "",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const chargeCalc = (() => {
    const ep = parseFloat(form.entryPrice);
    const qty = parseInt(form.quantity);
    if (!ep || !qty) return calcZerodhaCharges(form.tradeType, 0, 0);
    const xp = form.exitPrice ? parseFloat(form.exitPrice) : null;
    return calcZerodhaCharges(form.tradeType, ep, qty, xp);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPrice = parseFloat(form.entryPrice);
    const quantity = parseInt(form.quantity);
    const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : null;
    const charges = chargeCalc.total;

    let profitLoss = null;
    let netPnL = null;
    let status = "OPEN";

    if (exitPrice) {
      status = "CLOSED";
      if (form.positionType === "LONG") {
        profitLoss = (exitPrice - entryPrice) * quantity;
      } else {
        profitLoss = (entryPrice - exitPrice) * quantity;
      }
      netPnL = profitLoss - charges;
    }

    createMutation.mutate({
      symbol: form.symbol.toUpperCase(),
      tradeType: form.tradeType,
      positionType: form.positionType,
      segment: form.segment,
      entryPrice,
      exitPrice,
      quantity,
      lotSize: form.lotSize ? parseInt(form.lotSize) : null,
      strikePrice: form.strikePrice ? parseFloat(form.strikePrice) : null,
      optionType: form.optionType || null,
      expiry: form.expiry || null,
      entryDate: form.entryDate,
      exitDate: form.exitDate || null,
      status,
      profitLoss,
      charges,
      netPnL,
      notes: form.notes || null,
      emotionEntry: form.emotionEntry || null,
      emotionExit: null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Symbol</Label>
              <Input
                data-testid="input-trade-symbol"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="NIFTY, RELIANCE..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trade Type</Label>
              <Select value={form.tradeType} onValueChange={(v) => setForm({ ...form, tradeType: v })}>
                <SelectTrigger data-testid="select-trade-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FNO">F&O</SelectItem>
                  <SelectItem value="SWING">Swing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Position</Label>
              <Select value={form.positionType} onValueChange={(v) => setForm({ ...form, positionType: v })}>
                <SelectTrigger data-testid="select-position-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Segment</Label>
              <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                <SelectTrigger data-testid="select-segment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="OPTIONS">Options</SelectItem>
                  <SelectItem value="CURRENCY">Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Entry Price</Label>
              <Input data-testid="input-entry-price" type="number" step="0.01" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input data-testid="input-quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Charges (auto)</Label>
              <Input data-testid="input-charges" type="number" step="0.01" value={chargeCalc.total} readOnly className="bg-muted/50" />
            </div>
          </div>

          {form.tradeType === "FNO" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lot Size</Label>
                <Input type="number" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Strike Price</Label>
                <Input type="number" step="0.01" value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Option Type</Label>
                <Select value={form.optionType} onValueChange={(v) => setForm({ ...form, optionType: v })}>
                  <SelectTrigger><SelectValue placeholder="CE/PE" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CE">CE (Call)</SelectItem>
                    <SelectItem value="PE">PE (Put)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Entry Date</Label>
              <Input data-testid="input-entry-date" type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exit Price (optional)</Label>
              <Input data-testid="input-exit-price" type="number" step="0.01" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} placeholder="Leave empty for open" />
            </div>
          </div>

          {form.exitPrice && (
            <div className="space-y-1.5">
              <Label className="text-xs">Exit Date</Label>
              <Input type="date" value={form.exitDate} onChange={(e) => setForm({ ...form, exitDate: e.target.value })} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Emotion at Entry</Label>
            <Select value={form.emotionEntry} onValueChange={(v) => setForm({ ...form, emotionEntry: v })}>
              <SelectTrigger data-testid="select-emotion-entry"><SelectValue placeholder="How are you feeling?" /></SelectTrigger>
              <SelectContent>
                {emotions.map((e) => (
                  <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea data-testid="input-trade-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Trade rationale, observations..." className="resize-none" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags (comma separated)</Label>
            <Input data-testid="input-trade-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="breakout, trend, nifty..." />
          </div>

          <ChargeBreakdownDisplay charges={chargeCalc} />

          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-trade">
            {createMutation.isPending ? "Adding..." : "Add Trade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CloseTradeDialog({ trade, open, onOpenChange }: { trade: Trade; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [emotionExit, setEmotionExit] = useState("");

  const closeMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/trades/${trade.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "Trade closed" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const closeChargeCalc = (() => {
    const ep = parseFloat(exitPrice);
    if (!ep) return calcZerodhaCharges(trade.tradeType, trade.entryPrice, trade.quantity);
    return calcZerodhaCharges(trade.tradeType, trade.entryPrice, trade.quantity, ep);
  })();

  const handleClose = () => {
    const ep = parseFloat(exitPrice);
    const totalCharges = closeChargeCalc.total;

    let profitLoss: number;
    if (trade.positionType === "LONG") {
      profitLoss = (ep - trade.entryPrice) * trade.quantity;
    } else {
      profitLoss = (trade.entryPrice - ep) * trade.quantity;
    }
    const netPnL = profitLoss - totalCharges;

    closeMutation.mutate({
      exitPrice: ep,
      exitDate,
      status: "CLOSED",
      profitLoss,
      charges: totalCharges,
      netPnL,
      emotionExit: emotionExit || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Close {trade.symbol}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Exit Price</Label>
            <Input type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} data-testid="input-close-exit-price" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Exit Date</Label>
            <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Exit Emotion</Label>
            <Select value={emotionExit} onValueChange={setEmotionExit}>
              <SelectTrigger><SelectValue placeholder="How do you feel?" /></SelectTrigger>
              <SelectContent>
                {emotions.map((e) => (
                  <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ChargeBreakdownDisplay charges={closeChargeCalc} />
          <Button onClick={handleClose} className="w-full" disabled={!exitPrice || closeMutation.isPending} data-testid="button-confirm-close-trade">
            {closeMutation.isPending ? "Closing..." : "Close Trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTradeDialog({ trade, open, onOpenChange }: { trade: Trade; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    symbol: trade.symbol,
    tradeType: trade.tradeType,
    positionType: trade.positionType,
    segment: trade.segment,
    entryPrice: String(trade.entryPrice),
    exitPrice: trade.exitPrice ? String(trade.exitPrice) : "",
    quantity: String(trade.quantity),
    lotSize: trade.lotSize ? String(trade.lotSize) : "",
    strikePrice: trade.strikePrice ? String(trade.strikePrice) : "",
    optionType: trade.optionType || "",
    expiry: trade.expiry || "",
    entryDate: trade.entryDate,
    exitDate: trade.exitDate || "",
    charges: String(trade.charges || 0),
    notes: trade.notes || "",
    emotionEntry: trade.emotionEntry || "",
    emotionExit: trade.emotionExit || "",
    tags: trade.tags?.join(", ") || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/trades/${trade.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "Trade updated" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const chargeCalc = (() => {
    const ep = parseFloat(form.entryPrice);
    const qty = parseInt(form.quantity);
    if (!ep || !qty) return calcZerodhaCharges(form.tradeType, 0, 0);
    const xp = form.exitPrice ? parseFloat(form.exitPrice) : null;
    return calcZerodhaCharges(form.tradeType, ep, qty, xp);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPrice = parseFloat(form.entryPrice);
    const quantity = parseInt(form.quantity);
    const exitPrice = form.exitPrice ? parseFloat(form.exitPrice) : null;
    const charges = chargeCalc.total;

    let profitLoss = trade.profitLoss;
    let netPnL = trade.netPnL;
    let status = trade.status;

    if (exitPrice) {
      status = "CLOSED";
      if (form.positionType === "LONG") {
        profitLoss = (exitPrice - entryPrice) * quantity;
      } else {
        profitLoss = (entryPrice - exitPrice) * quantity;
      }
      netPnL = profitLoss - charges;
    } else {
      status = "OPEN";
      profitLoss = null;
      netPnL = null;
    }

    updateMutation.mutate({
      symbol: form.symbol.toUpperCase(),
      tradeType: form.tradeType,
      positionType: form.positionType,
      segment: form.segment,
      entryPrice,
      exitPrice,
      quantity,
      lotSize: form.lotSize ? parseInt(form.lotSize) : null,
      strikePrice: form.strikePrice ? parseFloat(form.strikePrice) : null,
      optionType: form.optionType || null,
      expiry: form.expiry || null,
      entryDate: form.entryDate,
      exitDate: form.exitDate || null,
      status,
      profitLoss,
      charges,
      netPnL,
      notes: form.notes || null,
      emotionEntry: form.emotionEntry || null,
      emotionExit: form.emotionExit || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade - {trade.symbol}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Symbol</Label>
              <Input data-testid="input-edit-symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trade Type</Label>
              <Select value={form.tradeType} onValueChange={(v) => setForm({ ...form, tradeType: v })}>
                <SelectTrigger data-testid="select-edit-trade-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FNO">F&O</SelectItem>
                  <SelectItem value="SWING">Swing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Position</Label>
              <Select value={form.positionType} onValueChange={(v) => setForm({ ...form, positionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Segment</Label>
              <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="OPTIONS">Options</SelectItem>
                  <SelectItem value="CURRENCY">Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Entry Price</Label>
              <Input data-testid="input-edit-entry-price" type="number" step="0.01" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input data-testid="input-edit-quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Charges (auto)</Label>
              <Input data-testid="input-edit-charges" type="number" step="0.01" value={chargeCalc.total} readOnly className="bg-muted/50" />
            </div>
          </div>

          {form.tradeType === "FNO" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lot Size</Label>
                <Input type="number" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Strike Price</Label>
                <Input type="number" step="0.01" value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Option Type</Label>
                <Select value={form.optionType} onValueChange={(v) => setForm({ ...form, optionType: v })}>
                  <SelectTrigger><SelectValue placeholder="CE/PE" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CE">CE (Call)</SelectItem>
                    <SelectItem value="PE">PE (Put)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Entry Date</Label>
              <Input data-testid="input-edit-entry-date" type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exit Price</Label>
              <Input data-testid="input-edit-exit-price" type="number" step="0.01" value={form.exitPrice} onChange={(e) => setForm({ ...form, exitPrice: e.target.value })} placeholder="Leave empty for open" />
            </div>
          </div>

          {form.exitPrice && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Exit Date</Label>
                <Input data-testid="input-edit-exit-date" type="date" value={form.exitDate} onChange={(e) => setForm({ ...form, exitDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exit Emotion</Label>
                <Select value={form.emotionExit} onValueChange={(v) => setForm({ ...form, emotionExit: v })}>
                  <SelectTrigger><SelectValue placeholder="Exit feeling" /></SelectTrigger>
                  <SelectContent>
                    {emotions.map((e) => (
                      <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Entry Emotion</Label>
            <Select value={form.emotionEntry} onValueChange={(v) => setForm({ ...form, emotionEntry: v })}>
              <SelectTrigger data-testid="select-edit-emotion-entry"><SelectValue placeholder="How were you feeling?" /></SelectTrigger>
              <SelectContent>
                {emotions.map((e) => (
                  <SelectItem key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea data-testid="input-edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Trade rationale, observations..." className="resize-none" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags (comma separated)</Label>
            <Input data-testid="input-edit-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="breakout, trend, nifty..." />
          </div>

          <ChargeBreakdownDisplay charges={chargeCalc} />

          <Button type="submit" className="w-full" disabled={updateMutation.isPending} data-testid="button-submit-edit-trade">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TradeDetailDialog({ trade, open, onOpenChange }: { trade: Trade; open: boolean; onOpenChange: (o: boolean) => void }) {
  const charges = calcZerodhaCharges(trade.tradeType, trade.entryPrice, trade.quantity, trade.exitPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{trade.symbol}</span>
            <Badge variant="secondary" className="text-[10px]">{trade.tradeType}</Badge>
            <Badge variant="secondary" className="text-[10px]">{trade.positionType}</Badge>
            <Badge variant={trade.status === "OPEN" ? "outline" : "secondary"} className="text-[10px]">{trade.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entry Price</p>
              <p className="text-base font-mono font-semibold">{trade.entryPrice.toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{trade.entryDate}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exit Price</p>
              {trade.exitPrice ? (
                <>
                  <p className="text-base font-mono font-semibold">{trade.exitPrice.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{trade.exitDate || "-"}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Still open</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Quantity</p>
              <p className="text-sm font-mono font-medium">{trade.quantity}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Segment</p>
              <p className="text-sm font-medium">{trade.segment}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trade Value</p>
              <p className="text-sm font-mono font-medium">{(trade.entryPrice * trade.quantity).toLocaleString("en-IN")}</p>
            </div>
          </div>

          {trade.status === "CLOSED" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross P&L</p>
                <p className={`text-sm font-mono font-semibold ${(trade.profitLoss || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                  {(trade.profitLoss || 0) >= 0 ? "+" : ""}{(trade.profitLoss || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Charges</p>
                <p className="text-sm font-mono font-medium">{(trade.charges || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net P&L</p>
                <p className={`text-base font-mono font-bold ${(trade.netPnL || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                  {(trade.netPnL || 0) >= 0 ? "+" : ""}{(trade.netPnL || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          {(trade.tradeType === "FNO" && (trade.lotSize || trade.strikePrice || trade.optionType || trade.expiry)) && (
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">F&O Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {trade.lotSize && <div><span className="text-muted-foreground">Lot Size:</span> <span className="font-mono">{trade.lotSize}</span></div>}
                {trade.strikePrice && <div><span className="text-muted-foreground">Strike:</span> <span className="font-mono">{trade.strikePrice}</span></div>}
                {trade.optionType && <div><span className="text-muted-foreground">Option:</span> <span className="font-mono">{trade.optionType}</span></div>}
                {trade.expiry && <div><span className="text-muted-foreground">Expiry:</span> <span className="font-mono">{trade.expiry}</span></div>}
              </div>
            </div>
          )}

          {(trade.emotionEntry || trade.emotionExit) && (
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Emotions</p>
              <div className="flex gap-4 text-xs">
                {trade.emotionEntry && <div><span className="text-muted-foreground">Entry:</span> <span className="font-medium">{trade.emotionEntry}</span></div>}
                {trade.emotionExit && <div><span className="text-muted-foreground">Exit:</span> <span className="font-medium">{trade.emotionExit}</span></div>}
              </div>
            </div>
          )}

          {trade.tags && trade.tags.length > 0 && (
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {trade.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <ChargeBreakdownDisplay charges={charges} />

          <div className="p-3 rounded-lg border bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Trade Notes
            </p>
            {trade.notes ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes added yet. Edit this trade to add notes.</p>
            )}
          </div>

          {trade.status === "CLOSED" && trade.entryDate && trade.exitDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Held for {Math.max(1, Math.ceil((new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24)))} day(s)</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TradesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [closeTradeId, setCloseTradeId] = useState<Trade | null>(null);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [viewTrade, setViewTrade] = useState<Trade | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [dateMode, setDateMode] = useState<"all" | "daily" | "weekly" | "monthly" | "custom">("all");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { toast } = useToast();

  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({ title: "Trade deleted" });
    },
  });

  const effectiveDateRange = (() => {
    if (dateMode === "all") return { from: "", to: "", label: "" };
    if (dateMode === "custom") return { from: dateFrom, to: dateTo, label: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : dateFrom || dateTo };
    if (dateMode === "daily") {
      return { from: selectedDate, to: selectedDate, label: new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) };
    }
    if (dateMode === "weekly") {
      const d = new Date(selectedDate + "T00:00:00");
      const day = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((day + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const f = mon.toISOString().split("T")[0];
      const t = sun.toISOString().split("T")[0];
      return { from: f, to: t, label: `${mon.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${sun.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` };
    }
    if (dateMode === "monthly") {
      const [y, m] = selectedMonth.split("-");
      const firstDay = `${y}-${m}-01`;
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const lastDayStr = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
      return { from: firstDay, to: lastDayStr, label: new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" }) };
    }
    return { from: "", to: "", label: "" };
  })();

  const filtered = trades?.filter((t) => {
    if (filter === "OPEN") { if (t.status !== "OPEN") return false; }
    else if (filter === "CLOSED") { if (t.status !== "CLOSED") return false; }
    else if (filter === "FNO") { if (t.tradeType !== "FNO") return false; }
    else if (filter === "SWING") { if (t.tradeType !== "SWING") return false; }
    if (effectiveDateRange.from && t.entryDate < effectiveDateRange.from) return false;
    if (effectiveDateRange.to && t.entryDate > effectiveDateRange.to) return false;
    return true;
  }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()) || [];

  const dateRangePnL = (() => {
    if (dateMode === "all") return null;
    if (dateMode === "custom" && !dateFrom && !dateTo) return null;
    const closedInRange = filtered.filter(t => t.status === "CLOSED");
    const totalPnL = closedInRange.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const totalCharges = closedInRange.reduce((sum, t) => sum + (t.charges || 0), 0);
    const wins = closedInRange.filter(t => (t.netPnL || 0) > 0).length;
    const winRate = closedInRange.length > 0 ? ((wins / closedInRange.length) * 100).toFixed(0) : "0";
    return { totalPnL, totalCharges, closedCount: closedInRange.length, openCount: filtered.filter(t => t.status === "OPEN").length, wins, winRate };
  })();

  const navigateDate = (dir: number) => {
    if (dateMode === "daily") {
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + dir);
      setSelectedDate(d.toISOString().split("T")[0]);
    } else if (dateMode === "weekly") {
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + dir * 7);
      setSelectedDate(d.toISOString().split("T")[0]);
    } else if (dateMode === "monthly") {
      const [y, m] = selectedMonth.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1 + dir, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-trades-title">Trades</h1>
          <p className="text-sm text-muted-foreground">{trades?.length || 0} total trades</p>
        </div>
        <Button onClick={() => setAddOpen(true)} data-testid="button-add-trade">
          <Plus className="w-4 h-4 mr-1" /> Add Trade
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="ALL" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="OPEN" data-testid="tab-open">Open</TabsTrigger>
          <TabsTrigger value="CLOSED" data-testid="tab-closed">Closed</TabsTrigger>
          <TabsTrigger value="FNO" data-testid="tab-fno">F&O</TabsTrigger>
          <TabsTrigger value="SWING" data-testid="tab-swing">Swing</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card data-testid="card-date-filter">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "daily", "weekly", "monthly", "custom"] as const).map((mode) => (
              <Button
                key={mode}
                variant={dateMode === mode ? "default" : "secondary"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setDateMode(mode)}
                data-testid={`button-date-${mode}`}
              >
                {mode === "all" ? "All Time" : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>

          {dateMode === "daily" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)} data-testid="button-date-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" data-testid="input-date-daily" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)} data-testid="button-date-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-1">{effectiveDateRange.label}</span>
            </div>
          )}

          {dateMode === "weekly" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)} data-testid="button-week-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" data-testid="input-date-weekly" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)} data-testid="button-week-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-1">{effectiveDateRange.label}</span>
            </div>
          )}

          {dateMode === "monthly" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)} data-testid="button-month-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-44" data-testid="input-date-monthly" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)} data-testid="button-month-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-1">{effectiveDateRange.label}</span>
            </div>
          )}

          {dateMode === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" data-testid="input-date-from" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" data-testid="input-date-to" />
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }} data-testid="button-clear-dates">
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          )}

          {dateRangePnL && (
            <div className="p-3 rounded-lg border bg-muted/20 flex flex-wrap items-center gap-4" data-testid="card-date-range-pnl">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net P&L</p>
                <p className={`text-lg font-mono font-semibold ${dateRangePnL.totalPnL >= 0 ? "text-profit" : "text-loss"}`}>
                  {dateRangePnL.totalPnL >= 0 ? "+" : ""}{dateRangePnL.totalPnL.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trades</p>
                <p className="text-sm font-mono">{dateRangePnL.closedCount} closed{dateRangePnL.openCount > 0 ? `, ${dateRangePnL.openCount} open` : ""}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
                <p className="text-sm font-mono">{dateRangePnL.winRate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Charges</p>
                <p className="text-sm font-mono">{dateRangePnL.totalCharges.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          )}

          {dateMode === "all" && (
            <p className="text-xs text-muted-foreground">Select a view to filter trades by date</p>
          )}
        </CardContent>
      </Card>

      {(() => {
        const monthMap = new Map<string, { trades: number; wins: number; losses: number; pnl: number; charges: number }>();
        (trades || []).filter(t => t.status === "CLOSED").forEach(t => {
          const d = t.exitDate || t.entryDate;
          const [y, m] = d.split("-");
          const key = `${y}-${m}`;
          const entry = monthMap.get(key) || { trades: 0, wins: 0, losses: 0, pnl: 0, charges: 0 };
          entry.trades++;
          if ((t.netPnL || 0) >= 0) entry.wins++; else entry.losses++;
          entry.pnl += t.netPnL || 0;
          entry.charges += t.charges || 0;
          monthMap.set(key, entry);
        });
        const openByMonth = new Map<string, number>();
        (trades || []).filter(t => t.status === "OPEN").forEach(t => {
          const [y, m] = t.entryDate.split("-");
          const key = `${y}-${m}`;
          openByMonth.set(key, (openByMonth.get(key) || 0) + 1);
        });
        const months = Array.from(new Set([...monthMap.keys(), ...openByMonth.keys()])).sort().reverse();

        if (months.length === 0) return null;
        return (
          <Card data-testid="card-monthly-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Monthly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {months.slice(0, 6).map(month => {
                  const data = monthMap.get(month) || { trades: 0, wins: 0, losses: 0, pnl: 0, charges: 0 };
                  const openCount = openByMonth.get(month) || 0;
                  const [y, m] = month.split("-");
                  const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
                  const winRate = data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(0) : "0";
                  return (
                    <div key={month} className="p-3 rounded-lg border bg-muted/20" data-testid={`monthly-${month}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                      <p className={`text-lg font-mono font-semibold ${data.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {data.pnl >= 0 ? "+" : ""}{data.pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span>{data.trades} closed</span>
                        {openCount > 0 && <span>{openCount} open</span>}
                        <span>{winRate}% win</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Charges: {data.charges.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No trades found</p>
            <Button variant="secondary" className="mt-3" onClick={() => setAddOpen(true)} data-testid="button-add-first-trade">
              Add your first trade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <Card key={trade.id} className="cursor-pointer transition-colors hover:bg-muted/10" role="button" tabIndex={0} onClick={() => setViewTrade(trade)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewTrade(trade); } }} data-testid={`card-trade-${trade.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      trade.status === "OPEN" ? "bg-chart-4/10" : (trade.netPnL || 0) >= 0 ? "bg-profit/10" : "bg-loss/10"
                    }`}>
                      {(trade.netPnL || 0) >= 0 ? (
                        <TrendingUp className={`w-4 h-4 ${trade.status === "OPEN" ? "text-chart-4" : "text-profit"}`} />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-loss" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-medium">{trade.symbol}</span>
                        <Badge variant="secondary" className="text-[10px]">{trade.tradeType}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{trade.positionType}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{trade.segment}</Badge>
                        {trade.status === "OPEN" && <Badge variant="outline" className="text-[10px]">OPEN</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Entry: {trade.entryPrice} x {trade.quantity}
                        {trade.exitPrice ? ` | Exit: ${trade.exitPrice}` : ""}
                        {trade.charges ? ` | Chg: ${trade.charges.toLocaleString("en-IN")}` : ""}
                        {" | "}{trade.entryDate}
                      </p>
                      {trade.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 truncate max-w-xs">
                          <StickyNote className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{trade.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {trade.status === "CLOSED" && (
                      <span className={`text-sm font-mono font-semibold ${
                        (trade.netPnL || 0) >= 0 ? "text-profit" : "text-loss"
                      }`}>
                        {(trade.netPnL || 0) >= 0 ? "+" : ""}{(trade.netPnL || 0).toLocaleString("en-IN")}
                      </span>
                    )}
                    {trade.status === "OPEN" && (
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setCloseTradeId(trade); }} data-testid={`button-close-trade-${trade.id}`}>
                        Close
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setViewTrade(trade); }} data-testid={`button-view-trade-${trade.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditTrade(trade); }} data-testid={`button-edit-trade-${trade.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(trade.id); }} data-testid={`button-delete-trade-${trade.id}`}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddTradeDialog open={addOpen} onOpenChange={setAddOpen} />
      {closeTradeId && (
        <CloseTradeDialog
          trade={closeTradeId}
          open={!!closeTradeId}
          onOpenChange={(o) => !o && setCloseTradeId(null)}
        />
      )}
      {editTrade && (
        <EditTradeDialog
          key={editTrade.id}
          trade={editTrade}
          open={!!editTrade}
          onOpenChange={(o) => !o && setEditTrade(null)}
        />
      )}
      {viewTrade && (
        <TradeDetailDialog
          trade={viewTrade}
          open={!!viewTrade}
          onOpenChange={(o) => !o && setViewTrade(null)}
        />
      )}
    </div>
  );
}
