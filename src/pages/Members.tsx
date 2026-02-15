import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, UserPlus } from "lucide-react";
import MemberDetail from "@/components/MemberDetail";

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "", father_name: "", phone: "", cnic: "", address: "",
    membership_type: "annual" as "annual" | "life",
    membership_start_date: new Date().toISOString().split("T")[0],
    rafaqat_no: "",
    installment_option: false, total_installments: 0, notes: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setMembers(data || []);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    const { total_installments, ...rest } = form;
    const isLifetimeFullPayment = rest.membership_type === "life" && !rest.installment_option;
    const { data: newMember, error } = await supabase.from("members").insert({
      ...rest,
      rafaqat_no: rest.rafaqat_no || null,
      created_by: user?.id,
      total_installments: rest.installment_option ? total_installments : 0,
      paid_installments: 0,
      // Auto-complete lifetime full payment members
      ...(isLifetimeFullPayment ? { total_paid: 6000, status: "completed" as const } : {}),
    } as any).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Auto-record the full payment for lifetime members
      if (isLifetimeFullPayment && newMember) {
        await supabase.from("payments").insert({
          member_id: newMember.id,
          amount: 6000,
          payment_date: rest.membership_start_date,
          payment_method: "Full Payment",
          receipt_number: "",
          created_by: user?.id,
        });
      }
      toast({ title: "Member added successfully", description: isLifetimeFullPayment ? "Lifetime membership marked as fully paid" : undefined });
      setDialogOpen(false);
      setForm({ full_name: "", father_name: "", phone: "", cnic: "", address: "", rafaqat_no: "", membership_type: "annual", membership_start_date: new Date().toISOString().split("T")[0], installment_option: false, total_installments: 0, notes: "" });
      fetchMembers();
    }
  };

  const filtered = members.filter((m) => {
    const matchSearch = !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search) || m.cnic?.includes(search);
    const matchType = filterType === "all" || m.membership_type === filterType;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  if (selectedMember) {
    return <MemberDetail member={selectedMember} onBack={() => { setSelectedMember(null); fetchMembers(); }} />;
  }

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-description">{members.length} total members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Add Member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Father Name</Label>
                  <Input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Rafaqat No.</Label>
                  <Input value={form.rafaqat_no} onChange={(e) => setForm({ ...form, rafaqat_no: e.target.value })} placeholder="e.g. R-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>CNIC</Label>
                  <Input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Membership Type</Label>
                  <Select value={form.membership_type} onValueChange={(v: "annual" | "life") => setForm({ ...form, membership_type: v, installment_option: v === "life" ? form.installment_option : false, total_installments: v === "life" ? form.total_installments : 0 })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual (Rs. 1,000/yr)</SelectItem>
                      <SelectItem value="life">Life (Rs. 6,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.membership_start_date} onChange={(e) => setForm({ ...form, membership_start_date: e.target.value })} />
                </div>
              </div>
              {form.membership_type === "life" && (
                <div className="flex items-center gap-3">
                  <Switch checked={form.installment_option} onCheckedChange={(v) => setForm({ ...form, installment_option: v, total_installments: v ? 1 : 0 })} />
                  <Label>Installment Payment (6 × Rs. 1,000/month)</Label>
                </div>
              )}
              {form.installment_option && (
                <div className="space-y-1.5">
                  <Label>Total Installments</Label>
                  <Select value={String(form.total_installments)} onValueChange={(v) => setForm({ ...form, total_installments: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Select installments" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} Installment{n > 1 ? "s" : ""} — Rs. 1,000/month
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button type="submit" className="w-full">Add Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, or CNIC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="life">Life</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_payment">Pending</SelectItem>
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
                  <TableHead>Rafaqat No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No members found</TableCell></TableRow>
                ) : filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMember(m)}>
                    <TableCell className="font-mono text-xs">{m.rafaqat_no || "—"}</TableCell>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell>{m.phone || "—"}</TableCell>
                    <TableCell>{m.membership_type === "life" ? (m.installment_option ? "Installment" : "Lifetime") : "Annual"}</TableCell>
                    <TableCell>Rs. {Number(m.total_paid).toLocaleString()}</TableCell>
                    <TableCell>Rs. {Number(m.remaining_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === "completed" ? "bg-success/10 text-success" :
                        m.status === "active" ? "bg-info/10 text-info" :
                        "bg-accent/20 text-accent-foreground"
                      }`}>{m.status?.replace("_", " ")}</span>
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

export default Members;
