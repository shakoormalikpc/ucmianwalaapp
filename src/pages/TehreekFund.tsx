import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTehreekFund, notifyFundUpdated, FundAccount } from "@/hooks/useTehreekFund";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Wallet, HandCoins, Receipt, Landmark, Banknote } from "lucide-react";
import { format } from "date-fns";

const today = () => new Date().toISOString().split("T")[0];

interface Contribution {
  id: string;
  member_id: string | null;
  funder_name: string;
  amount: number;
  contribution_date: string;
  fund_account_id: string | null;
  notes: string | null;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  fund_account_id: string | null;
  description: string | null;
}

const accountLabel = (id: string | null, accounts: FundAccount[]) => {
  if (!id) return "—";
  const acc = accounts.find((a) => a.id === id);
  return acc ? acc.name : "—";
};

const TehreekFund = () => {
  const { user, isPresident } = useAuth();
  const { toast } = useToast();
  const { totalContributions, totalExpenses, balance, accounts, accountBalances, loading } = useTehreekFund();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberNames, setMemberNames] = useState<string[]>([]);

  const [addContribOpen, setAddContribOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const [contribForm, setContribForm] = useState({ funder_name: "", amount: "", contribution_date: today(), fund_account_id: "", notes: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", expense_date: today(), fund_account_id: "", description: "" });
  const [accountForm, setAccountForm] = useState({ name: "", account_type: "cash", bank_name: "", account_number: "", notes: "" });

  const fetchData = async () => {
    const [cRes, eRes, mRes] = await Promise.all([
      supabase.from("fund_contributions").select("*").order("contribution_date", { ascending: false }),
      supabase.from("fund_expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("members").select("full_name").order("full_name", { ascending: true }),
    ]);
    setContributions((cRes.data as Contribution[]) || []);
    setExpenses((eRes.data as Expense[]) || []);
    setMemberNames(((mRes.data as { full_name: string }[]) || []).map((m) => m.full_name));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("fund_contributions").insert({
      funder_name: contribForm.funder_name.trim(),
      amount: Number(contribForm.amount),
      contribution_date: contribForm.contribution_date,
      fund_account_id: contribForm.fund_account_id || null,
      notes: contribForm.notes || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contribution recorded" });
      setAddContribOpen(false);
      setContribForm({ funder_name: "", amount: "", contribution_date: today(), fund_account_id: "", notes: "" });
      fetchData();
      notifyFundUpdated();
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("fund_expenses").insert({
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      expense_date: expenseForm.expense_date,
      fund_account_id: expenseForm.fund_account_id || null,
      description: expenseForm.description || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Program expense recorded" });
      setAddExpenseOpen(false);
      setExpenseForm({ title: "", amount: "", expense_date: today(), fund_account_id: "", description: "" });
      fetchData();
      notifyFundUpdated();
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("fund_accounts").insert({
      name: accountForm.name.trim(),
      account_type: accountForm.account_type,
      bank_name: accountForm.account_type === "bank" ? accountForm.bank_name.trim() || null : null,
      account_number: accountForm.account_type === "bank" ? accountForm.account_number.trim() || null : null,
      notes: accountForm.notes || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fund account added" });
      setAddAccountOpen(false);
      setAccountForm({ name: "", account_type: "cash", bank_name: "", account_number: "", notes: "" });
      fetchData();
      notifyFundUpdated();
    }
  };

  const handleDeleteContribution = async (id: string) => {
    const { error } = await supabase.from("fund_contributions").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Contribution deleted" }); fetchData(); notifyFundUpdated(); }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from("fund_expenses").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Program expense deleted" }); fetchData(); notifyFundUpdated(); }
  };

  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase.from("fund_accounts").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Fund account deleted" }); fetchData(); notifyFundUpdated(); }
  };

  const deleteCell = (onDelete: () => void, label: string, what: string) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={!isPresident}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to delete this {what}? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Tehreek Fund</h1>
          <p className="page-description">Program contributions, expenses and fund availability</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <MetricCard title="Total Received" value={`Rs. ${totalContributions.toLocaleString()}`} icon={HandCoins} variant="primary" />
        <MetricCard title="Total Expenses" value={`Rs. ${totalExpenses.toLocaleString()}`} icon={Receipt} variant="warning" />
        <MetricCard title="Remaining Balance" value={`Rs. ${balance.toLocaleString()}`} icon={Wallet} variant="success" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-semibold">Fund Availability</h2>
              <p className="text-xs text-muted-foreground">Where the fund money is held — cash or bank account</p>
            </div>
            <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Add Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Add Fund Account</DialogTitle></DialogHeader>
                <form onSubmit={handleAddAccount} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Account Name *</Label>
                    <Input placeholder="e.g. Cash Box / Meezan Bank" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type *</Label>
                    <Select value={accountForm.account_type} onValueChange={(v) => setAccountForm({ ...accountForm, account_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {accountForm.account_type === "bank" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Bank Name</Label>
                        <Input value={accountForm.bank_name} onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Account Number</Label>
                        <Input value={accountForm.account_number} onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Input value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Add Account</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No fund accounts yet. Add cash or bank accounts to track where the fund is held.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {a.account_type === "bank" ? <Landmark className="w-4 h-4 text-primary" /> : <Banknote className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{a.name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{a.account_type === "bank" ? "Bank" : "Cash"}</Badge>
                    </div>
                    {a.account_type === "bank" && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[a.bank_name, a.account_number].filter(Boolean).join(" • ") || "—"}
                      </p>
                    )}
                    <p className="text-sm font-heading font-bold mt-1">Rs. {(accountBalances[a.id] ?? 0).toLocaleString()}</p>
                  </div>
                  {isPresident && deleteCell(() => handleDeleteAccount(a.id), "Delete Fund Account", "fund account")}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="contributions">
        <TabsList className="mb-3">
          <TabsTrigger value="contributions">Contributions ({contributions.length})</TabsTrigger>
          <TabsTrigger value="expenses">Program Expenses ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions">
          <div className="flex justify-end mb-3">
            <Dialog open={addContribOpen} onOpenChange={setAddContribOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Contribution</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Add Contribution</DialogTitle></DialogHeader>
                <form onSubmit={handleAddContribution} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input list="member-names" placeholder="Select or type a name" value={contribForm.funder_name} onChange={(e) => setContribForm({ ...contribForm, funder_name: e.target.value })} required />
                    <datalist id="member-names">
                      {memberNames.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Amount *</Label>
                      <Input type="number" min="1" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={contribForm.contribution_date} onChange={(e) => setContribForm({ ...contribForm, contribution_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Received In</Label>
                    <Select value={contribForm.fund_account_id} onValueChange={(v) => setContribForm({ ...contribForm, fund_account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select account (optional)" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.account_type === "bank" ? "Bank" : "Cash"})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea rows={2} value={contribForm.notes} onChange={(e) => setContribForm({ ...contribForm, notes: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Record Contribution</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Received In</TableHead>
                    <TableHead>Notes</TableHead>
                    {isPresident && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? null : contributions.length === 0 ? (
                    <TableRow><TableCell colSpan={isPresident ? 6 : 5} className="text-center py-8 text-muted-foreground">No contributions yet</TableCell></TableRow>
                  ) : contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.funder_name}</TableCell>
                      <TableCell className="font-semibold">Rs. {Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(c.contribution_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{accountLabel(c.fund_account_id, accounts)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                      {isPresident && <TableCell>{deleteCell(() => handleDeleteContribution(c.id), "Delete Contribution", `contribution from ${c.funder_name}`)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="flex justify-end mb-3">
            <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Program Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Add Program Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input placeholder="e.g. Milad arrangement" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Amount *</Label>
                      <Input type="number" min="1" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Paid From</Label>
                    <Select value={expenseForm.fund_account_id} onValueChange={(v) => setExpenseForm({ ...expenseForm, fund_account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select account (optional)" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.account_type === "bank" ? "Bank" : "Cash"})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea rows={2} value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Record Expense</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Paid From</TableHead>
                    <TableHead>Description</TableHead>
                    {isPresident && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? null : expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={isPresident ? 6 : 5} className="text-center py-8 text-muted-foreground">No program expenses yet</TableCell></TableRow>
                  ) : expenses.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="font-medium">{x.title}</TableCell>
                      <TableCell className="font-semibold">Rs. {Number(x.amount).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(x.expense_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{accountLabel(x.fund_account_id, accounts)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{x.description || "—"}</TableCell>
                      {isPresident && <TableCell>{deleteCell(() => handleDeleteExpense(x.id), "Delete Program Expense", `expense "${x.title}"`)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TehreekFund;
