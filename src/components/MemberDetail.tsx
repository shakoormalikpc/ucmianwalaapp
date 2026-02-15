import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, CalendarCheck, Lock } from "lucide-react";
import { addYears, format } from "date-fns";

interface Props {
  member: any;
  onBack: () => void;
}

const MemberDetail = ({ member, onBack }: Props) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [memberData, setMemberData] = useState(member);
  const [payDialog, setPayDialog] = useState(false);
  const [installmentDialog, setInstallmentDialog] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState("");
  const [payForm, setPayForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "", remarks: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPayments = async () => {
    const { data } = await supabase.from("payments").select("*").eq("member_id", member.id).order("payment_date", { ascending: false });
    setPayments(data || []);
  };

  const refreshMember = async () => {
    const { data } = await supabase.from("members").select("*").eq("id", member.id).maybeSingle();
    if (data) setMemberData(data);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleSetInstallmentPlan = async () => {
    const count = Number(selectedInstallments);
    if (!count || count < 1 || count > 6) return;
    const { error } = await supabase.from("members").update({
      total_installments: count,
      paid_installments: 0,
      installment_option: true,
    }).eq("id", member.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Installment plan set", description: `${count} installments of Rs. ${Math.ceil(Number(memberData.total_required) / count).toLocaleString()} each` });
      setInstallmentDialog(false);
      setSelectedInstallments("");
      refreshMember();
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payForm.amount);
    if (amount <= 0) return;
    const remaining = Number(memberData.remaining_amount);
    if (amount > remaining) {
      toast({ title: "Error", description: `Amount exceeds remaining balance (Rs. ${remaining.toLocaleString()})`, variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("payments").insert({
      member_id: member.id,
      amount,
      payment_date: payForm.payment_date,
      payment_method: payForm.payment_method || null,
      remarks: payForm.remarks || null,
      receipt_number: "",
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update paid_installments if installment plan is active
    if (memberData.total_installments > 0 && memberData.paid_installments < memberData.total_installments) {
      const newPaid = memberData.paid_installments + 1;
      await supabase.from("members").update({
        paid_installments: newPaid,
      } as any).eq("id", member.id);
    }

    toast({ title: "Payment recorded", description: `Installment ${(memberData.paid_installments || 0) + 1} of ${memberData.total_installments} paid on ${payForm.payment_date}` });
    setPayDialog(false);
    setPayForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "", remarks: "" });
    fetchPayments();
    refreshMember();
  };

  const expiryDate = memberData.membership_type === "annual"
    ? format(addYears(new Date(memberData.membership_start_date), 1), "dd MMM yyyy")
    : "Lifetime";

  const hasInstallmentPlan = memberData.total_installments > 0;
  const installmentAmount = 1000;
  const remainingInstallments = hasInstallmentPlan ? memberData.total_installments - memberData.paid_installments : 0;
  const isCompleted = memberData.status === "completed";
  const installmentProgress = hasInstallmentPlan ? (memberData.paid_installments / memberData.total_installments) * 100 : 0;

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Members</Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">{memberData.full_name}</CardTitle>
              {isCompleted && <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Completed</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Rafaqat No.:</span> {memberData.rafaqat_no || "—"}</div>
              <div><span className="text-muted-foreground">Father:</span> {memberData.father_name || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {memberData.phone || "—"}</div>
              <div><span className="text-muted-foreground">CNIC:</span> {memberData.cnic || "—"}</div>
              <div><span className="text-muted-foreground">Address:</span> {memberData.address || "—"}</div>
              <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{memberData.membership_type}</span></div>
              <div><span className="text-muted-foreground">Start:</span> {format(new Date(memberData.membership_start_date), "dd MMM yyyy")}</div>
              <div><span className="text-muted-foreground">Expiry:</span> {expiryDate}</div>
              <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{memberData.status?.replace("_", " ")}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Required</span>
              <span className="font-semibold">Rs. {Number(memberData.total_required).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-success">Rs. {Number(memberData.total_paid).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-destructive">Rs. {Number(memberData.remaining_amount).toLocaleString()}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-success h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (Number(memberData.total_paid) / Number(memberData.total_required)) * 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installment Plan Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Installment Plan
          </CardTitle>
          {!hasInstallmentPlan && !isCompleted && (
            <Dialog open={installmentDialog} onOpenChange={setInstallmentDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Add Installment Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Set Installment Plan</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Total amount: <strong>Rs. {Number(memberData.total_required).toLocaleString()}</strong>
                  </p>
                  <div className="space-y-1.5">
                    <Label>Select Total Installments</Label>
                    <Select value={selectedInstallments} onValueChange={setSelectedInstallments}>
                      <SelectTrigger><SelectValue placeholder="Select installments..." /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} Installment{n > 1 ? "s" : ""} — Rs. {Math.ceil(Number(memberData.total_required) / n).toLocaleString()}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedInstallments && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between"><span>Total Amount:</span><span className="font-semibold">Rs. {Number(memberData.total_required).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Installments:</span><span className="font-semibold">{selectedInstallments}</span></div>
                      <div className="flex justify-between"><span>Per Installment:</span><span className="font-semibold">Rs. {Math.ceil(Number(memberData.total_required) / Number(selectedInstallments)).toLocaleString()}</span></div>
                    </div>
                  )}
                  <Button onClick={handleSetInstallmentPlan} disabled={!selectedInstallments} className="w-full">
                    Set Installment Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {hasInstallmentPlan ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{memberData.total_installments}</p>
                  <p className="text-xs text-muted-foreground">Total Installments</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{memberData.paid_installments}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{remainingInstallments}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(installmentProgress)}%</span>
                </div>
                <Progress value={installmentProgress} className="h-3" />
              </div>
              <p className="text-sm text-muted-foreground">
                Installment amount: <strong>Rs. {installmentAmount.toLocaleString()}</strong> per month
              </p>
              {isCompleted && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  All installments completed — no further payments needed
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isCompleted ? "Payment completed — no installment plan needed" : "No installment plan set. Click \"Add Installment Plan\" to set one up."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base">Payment History</CardTitle>
          {Number(memberData.remaining_amount) > 0 && !isCompleted && (
            <Dialog open={payDialog} onOpenChange={setPayDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Record Payment {hasInstallmentPlan ? `— Installment ${(memberData.paid_installments || 0) + 1} of ${memberData.total_installments}` : ""}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-4">
                  {hasInstallmentPlan && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <p>Installment Amount: <strong>Rs. {installmentAmount.toLocaleString()}</strong></p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Payment Date *</Label>
                    <Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount {hasInstallmentPlan ? `(Installment: Rs. ${installmentAmount.toLocaleString()})` : `(max Rs. ${Number(memberData.remaining_amount).toLocaleString()})`} *</Label>
                    <Input type="number" min="1" max={memberData.remaining_amount} value={payForm.amount || (hasInstallmentPlan ? String(installmentAmount) : "")} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <Input placeholder="Cash, Bank Transfer, etc." value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Input value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Record Payment</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                  <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-semibold">Rs. {Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{p.payment_method || "—"}</TableCell>
                  <TableCell>{p.remarks || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDetail;
