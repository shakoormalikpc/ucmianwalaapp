import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Trash2, FileDown } from "lucide-react";
import MemberDetail from "@/components/MemberDetail";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "", father_name: "", phone: "", cnic: "", address: "",
    member_type: "lifetime" as "lifetime" | "installment",
    membership_start_date: new Date().toISOString().split("T")[0],
    rafaqat_no: "",
    total_installments: 6, notes: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMembers = async () => {
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setMembers(data || []);
  };

  useEffect(() => { fetchMembers(); }, []);

  const resetForm = () => setForm({
    full_name: "", father_name: "", phone: "", cnic: "", address: "",
    member_type: "lifetime",
    membership_start_date: new Date().toISOString().split("T")[0],
    rafaqat_no: "", total_installments: 6, notes: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;

    const isInstallment = form.member_type === "installment";
    const isLifetime = form.member_type === "lifetime";

    const installmentTotal = isInstallment ? form.total_installments * 1000 : 6000;

    const { data: newMember, error } = await supabase.from("members").insert({
      full_name: form.full_name,
      father_name: form.father_name || null,
      phone: form.phone || null,
      cnic: form.cnic || null,
      address: form.address || null,
      rafaqat_no: form.rafaqat_no || null,
      membership_type: "life" as const,
      membership_start_date: form.membership_start_date,
      installment_option: isInstallment,
      total_installments: isInstallment ? form.total_installments : 0,
      paid_installments: 0,
      total_required: installmentTotal,
      total_paid: isLifetime ? 6000 : 0,
      status: isLifetime ? "completed" as const : "pending_payment" as const,
      notes: form.notes || null,
      created_by: user?.id,
    } as any).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (isLifetime && newMember) {
        await supabase.from("payments").insert({
          member_id: newMember.id,
          amount: 6000,
          payment_date: form.membership_start_date,
          payment_method: "Full Payment",
          receipt_number: "",
          created_by: user?.id,
        });
      }
      toast({
        title: "Member added successfully",
        description: isLifetime
          ? "Lifetime membership marked as fully paid"
          : `Installment plan: ${form.total_installments} × Rs. 1,000/month`,
      });
      setDialogOpen(false);
      resetForm();
      fetchMembers();
    }
  };

  const filtered = members.filter((m) => {
    const matchSearch = !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search) || m.cnic?.includes(search);
    const matchType = filterType === "all" || m.membership_type === filterType;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("payments").delete().eq("member_id", id);
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member deleted" });
      fetchMembers();
    }
  };

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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            exportToPDF({
              title: "Members Report",
              headers: ["Rafaqat No.", "Name", "Phone", "Type", "Paid", "Remaining", "Status"],
              rows: filtered.map((m) => [m.rafaqat_no || "—", m.full_name, m.phone || "—", m.membership_type === "life" ? (m.installment_option ? "Installment" : "Lifetime") : "Annual", `Rs. ${Number(m.total_paid).toLocaleString()}`, `Rs. ${Number(m.remaining_amount).toLocaleString()}`, m.status?.replace("_", " ")]),
              filename: "members-report",
            });
          }}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => {
            exportToExcel({
              title: "Members",
              headers: ["Rafaqat No.", "Name", "Phone", "Type", "Paid", "Remaining", "Status"],
              rows: filtered.map((m) => [m.rafaqat_no || "—", m.full_name, m.phone || "—", m.membership_type === "life" ? (m.installment_option ? "Installment" : "Lifetime") : "Annual", Number(m.total_paid), Number(m.remaining_amount), m.status?.replace("_", " ")]),
              filename: "members-report",
            });
          }}><FileDown className="w-4 h-4 mr-1" />Excel</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="w-4 h-4 mr-2" />Add Member</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Father Name</Label>
                    <Input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Rafaqat No.</Label>
                    <Input value={form.rafaqat_no} onChange={(e) => setForm({ ...form, rafaqat_no: e.target.value })} placeholder="e.g. R-001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>CNIC</Label>
                    <Input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Membership Type</Label>
                    <Select value={form.member_type} onValueChange={(v: "lifetime" | "installment") => setForm({ ...form, member_type: v, total_installments: v === "installment" ? 6 : 0 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lifetime">Lifetime (Rs. 6,000)</SelectItem>
                        <SelectItem value="installment">Installment (Rs. 1,000/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.membership_start_date} onChange={(e) => setForm({ ...form, membership_start_date: e.target.value })} />
                  </div>
                </div>

                {form.member_type === "installment" && (
                  <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                    <Label className="text-sm font-semibold">Number of Installments</Label>
                    <Select value={String(form.total_installments)} onValueChange={(v) => setForm({ ...form, total_installments: Number(v) })}>
                      <SelectTrigger><SelectValue placeholder="Select installments" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} × Rs. 1,000 = Rs. {(n * 1000).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Total: Rs. {(form.total_installments * 1000).toLocaleString()} of Rs. 6,000 — Remaining: Rs. {(6000 - form.total_installments * 1000).toLocaleString()}
                    </p>
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
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, or CNIC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="life">Life</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_payment">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rafaqat No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="hidden sm:table-cell">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No members found</TableCell></TableRow>
                ) : filtered.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMember(m)}>
                    <TableCell className="font-mono text-xs">{m.rafaqat_no || "—"}</TableCell>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{m.phone || "—"}</TableCell>
                    <TableCell>{m.membership_type === "life" ? (m.installment_option ? "Installment" : "Lifetime") : "Annual"}</TableCell>
                    <TableCell>
                      <div>
                        <span>Rs. {Number(m.total_paid).toLocaleString()}</span>
                        {m.installment_option && m.total_installments > 0 && (
                          <p className="text-xs text-muted-foreground">{m.paid_installments || 0}/{m.total_installments} installments</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">Rs. {Number(m.remaining_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.status === "completed" ? "bg-success/10 text-success" :
                        m.status === "active" ? "bg-info/10 text-info" :
                        "bg-accent/20 text-accent-foreground"
                      }`}>{m.status?.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Member</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete {m.full_name}? This will also delete all their payment records.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => handleDelete(m.id, e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
