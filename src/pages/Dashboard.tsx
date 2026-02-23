import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/MetricCard";
import { Users, Crown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardData {
  totalMembers: number;
  lifetimeMembers: number;
  totalDonations: number;
  totalExpenses: number;
  fundBalance: number;
  recentMembers: any[];
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    totalMembers: 0, lifetimeMembers: 0,
    totalDonations: 0, totalExpenses: 0,
    fundBalance: 0, recentMembers: [],
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [members, payments, donations, expenses, recent] = await Promise.all([
        supabase.from("members").select("membership_type, status"),
        supabase.from("payments").select("amount, payment_date"),
        supabase.from("donations").select("amount, donation_date"),
        supabase.from("expenses").select("amount, expense_date"),
        supabase.from("members").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const m = members.data || [];
      const p = payments.data || [];
      const d = donations.data || [];
      const e = expenses.data || [];

      const totalDonations = d.reduce((s, r) => s + Number(r.amount), 0);
      const totalExpenses = e.reduce((s, r) => s + Number(r.amount), 0);

      const monthMap: Record<string, { payments: number; donations: number; expenses: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach((m) => (monthMap[m] = { payments: 0, donations: 0, expenses: 0 }));
      p.forEach((r) => { const mi = new Date(r.payment_date).getMonth(); monthMap[months[mi]].payments += Number(r.amount); });
      d.forEach((r) => { const mi = new Date(r.donation_date || new Date()).getMonth(); monthMap[months[mi]].donations += Number(r.amount); });
      e.forEach((r) => { const mi = new Date(r.expense_date || new Date()).getMonth(); monthMap[months[mi]].expenses += Number(r.amount); });

      setMonthlyData(months.map((name) => ({ name, ...monthMap[name] })));

      setData({
        totalMembers: m.length,
        lifetimeMembers: m.filter((r) => r.membership_type === "life" && r.status === "completed").length,
        totalDonations, totalExpenses,
        fundBalance: totalDonations - totalExpenses,
        recentMembers: recent.data || [],
      });
    };

    fetchData();
  }, []);

  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

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
                <Bar dataKey="donations" fill="hsl(205, 80%, 50%)" name="Fund" radius={[4, 4, 0, 0]} />
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
    </div>
  );
};

export default Dashboard;
