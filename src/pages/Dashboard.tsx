import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/MetricCard";
import { Users, UserCheck, Crown, CreditCard, Heart, Receipt, Wallet, Clock, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  totalMembers: number;
  lifetimeMembers: number;
  totalPayments: number;
  totalDonations: number;
  totalExpenses: number;
  fundBalance: number;
  recentMembers: any[];
  recentPayments: any[];
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    totalMembers: 0, lifetimeMembers: 0,
    totalPayments: 0, totalDonations: 0, totalExpenses: 0,
    fundBalance: 0, recentMembers: [], recentPayments: [],
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [installmentMembers, setInstallmentMembers] = useState<any[]>([]);
  const [installmentSearch, setInstallmentSearch] = useState("");
  const [installmentFilter, setInstallmentFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("full_name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [members, payments, donations, expenses, recent, recentPay] = await Promise.all([
        supabase.from("members").select("membership_type, status"),
        supabase.from("payments").select("amount, payment_date"),
        supabase.from("donations").select("amount"),
        supabase.from("expenses").select("amount"),
        supabase.from("members").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("payments").select("*, members(full_name)").order("created_at", { ascending: false }).limit(5),
      ]);

      const m = members.data || [];
      const p = payments.data || [];
      const d = donations.data || [];
      const e = expenses.data || [];

      const totalPayments = p.reduce((s, r) => s + Number(r.amount), 0);
      const totalDonations = d.reduce((s, r) => s + Number(r.amount), 0);
      const totalExpenses = e.reduce((s, r) => s + Number(r.amount), 0);

      const monthMap: Record<string, { payments: number; donations: number; expenses: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach((m) => (monthMap[m] = { payments: 0, donations: 0, expenses: 0 }));
      p.forEach((r) => { const mi = new Date(r.payment_date).getMonth(); monthMap[months[mi]].payments += Number(r.amount); });
      d.forEach((r) => { const mi = new Date((r as any).donation_date || new Date()).getMonth(); monthMap[months[mi]].donations += Number(r.amount); });
      e.forEach((r) => { const mi = new Date((r as any).expense_date || new Date()).getMonth(); monthMap[months[mi]].expenses += Number(r.amount); });

      setMonthlyData(months.map((name) => ({ name, ...monthMap[name] })));

      setData({
        totalMembers: m.length,
        lifetimeMembers: m.filter((r) => r.membership_type === "life" && r.status === "completed").length,
        totalPayments, totalDonations, totalExpenses,
        fundBalance: totalDonations - totalExpenses,
        recentMembers: recent.data || [],
        recentPayments: recentPay.data || [],
      });
    };

    const fetchInstallmentMembers = async () => {
      const { data } = await supabase.from("members").select("*").order("full_name");
      setInstallmentMembers(data || []);
    };

    fetchData();
    fetchInstallmentMembers();
  }, []);

  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredInstallmentMembers = installmentMembers
    .filter((m) => {
      const matchSearch = !installmentSearch || m.full_name?.toLowerCase().includes(installmentSearch.toLowerCase());
      const matchFilter = installmentFilter === "all" ||
        (installmentFilter === "completed" && m.status === "completed") ||
        (installmentFilter === "pending" && m.status === "pending_payment") ||
        (installmentFilter === "active" && m.status === "active");
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "full_name": aVal = a.full_name; bVal = b.full_name; break;
        case "membership_type": aVal = a.membership_type; bVal = b.membership_type; break;
        case "total_installments": aVal = a.total_installments || 0; bVal = b.total_installments || 0; break;
        case "paid_installments": aVal = a.paid_installments || 0; bVal = b.paid_installments || 0; break;
        case "total_paid": aVal = Number(a.total_paid); bVal = Number(b.total_paid); break;
        case "remaining_amount": aVal = Number(a.remaining_amount); bVal = Number(b.remaining_amount); break;
        default: aVal = a.full_name; bVal = b.full_name;
      }
      if (typeof aVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  const getRowColor = (m: any) => {
    if (m.status === "completed") return "bg-emerald-50 dark:bg-emerald-950/20";
    if (m.status === "pending_payment") return "bg-red-50 dark:bg-red-950/20";
    const remaining = (m.total_installments || 0) - (m.paid_installments || 0);
    if (remaining > 0) return "bg-amber-50 dark:bg-amber-950/20";
    return "";
  };

  const SortableHead = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of UC membership and fund status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Total Members" value={data.totalMembers} icon={Users} variant="primary" />
        <MetricCard title="Lifetime Members" value={data.lifetimeMembers} icon={Crown} variant="success" />
        <MetricCard title="Fund Balance" value={fmt(data.fundBalance)} icon={Wallet} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="payments" fill="hsl(152, 60%, 40%)" name="Payments" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donations" fill="hsl(205, 80%, 50%)" name="Donations" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No members yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.membership_type} Member</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === "completed" ? "bg-success/10 text-success" :
                      m.status === "active" ? "bg-info/10 text-info" :
                      "bg-accent/20 text-accent-foreground"
                    }`}>
                      {m.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Installment Tracking Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading mb-3">Installment Tracking</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by member name..."
              value={installmentSearch}
              onChange={(e) => setInstallmentSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={installmentFilter} onValueChange={setInstallmentFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="full_name">Member Name</SortableHead>
                  <SortableHead field="membership_type">Type</SortableHead>
                  <SortableHead field="total_installments">Total Inst.</SortableHead>
                  <SortableHead field="paid_installments">Paid Inst.</SortableHead>
                  <TableHead>Remaining Inst.</TableHead>
                  <SortableHead field="total_paid">Total Paid</SortableHead>
                  <SortableHead field="remaining_amount">Remaining Amt</SortableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallmentMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No members found</TableCell></TableRow>
                ) : filteredInstallmentMembers.map((m) => (
                  <TableRow key={m.id} className={getRowColor(m)}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell>{m.membership_type === "life" ? (m.installment_option ? "Installment" : "Lifetime") : "Annual"}</TableCell>
                    <TableCell className="text-center">{m.total_installments || "—"}</TableCell>
                    <TableCell className="text-center">{m.paid_installments || "—"}</TableCell>
                    <TableCell className="text-center">
                      {m.total_installments ? (m.total_installments - (m.paid_installments || 0)) : "—"}
                    </TableCell>
                    <TableCell>Rs. {Number(m.total_paid).toLocaleString()}</TableCell>
                    <TableCell>Rs. {Number(m.remaining_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {m.status === "completed" ? (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Completed</Badge>
                      ) : m.status === "pending_payment" ? (
                        <Badge variant="destructive">Pending</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
