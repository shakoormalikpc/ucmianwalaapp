import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileDown } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";

const Donations = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ donor_name: "", contact_number: "", amount: "", donation_date: new Date().toISOString().split("T")[0], description: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDonations = async () => {
    const { data } = await supabase.from("donations").select("*").order("donation_date", { ascending: false });
    setDonations(data || []);
  };

  useEffect(() => { fetchDonations(); }, []);

  const total = donations.reduce((s, d) => s + Number(d.amount), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("donations").insert({
      donor_name: form.donor_name,
      contact_number: form.contact_number || null,
      amount: Number(form.amount),
      donation_date: form.donation_date,
      description: form.description || null,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Fund recorded" });
      setDialogOpen(false);
      setForm({ donor_name: "", contact_number: "", amount: "", donation_date: new Date().toISOString().split("T")[0], description: "" });
      fetchDonations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fund entry deleted" });
      fetchDonations();
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Fund</h1>
          <p className="page-description">Total: Rs. {total.toLocaleString()} from {donations.length} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToPDF({
            title: "Fund Report", headers: ["Name", "Contact", "Amount", "Date", "Description"],
            rows: donations.map((d) => [d.donor_name, d.contact_number || "—", `Rs. ${Number(d.amount).toLocaleString()}`, format(new Date(d.donation_date), "dd MMM yyyy"), d.description || "—"]),
            filename: "fund-report",
          })}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel({
            title: "Fund", headers: ["Name", "Contact", "Amount", "Date", "Description"],
            rows: donations.map((d) => [d.donor_name, d.contact_number || "—", Number(d.amount), format(new Date(d.donation_date), "dd MMM yyyy"), d.description || "—"]),
            filename: "fund-report",
          })}><FileDown className="w-4 h-4 mr-1" />Excel</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Fund</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Record Fund</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Contact Number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount *</Label><Input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <Button type="submit" className="w-full">Record Fund</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No fund records</TableCell></TableRow>
              ) : donations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.donor_name}</TableCell>
                  <TableCell>{d.contact_number || "—"}</TableCell>
                  <TableCell className="font-semibold">Rs. {Number(d.amount).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(d.donation_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{d.description || "—"}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Fund Entry</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete this fund entry from {d.donor_name}? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(d.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Donations;