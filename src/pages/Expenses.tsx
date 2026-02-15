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

const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", expense_date: new Date().toISOString().split("T")[0], description: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setExpenses(data || []);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert({
      title: form.title,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      description: form.description || null,
      created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Expense recorded" });
      setDialogOpen(false);
      setForm({ title: "", amount: "", expense_date: new Date().toISOString().split("T")[0], description: "" });
      fetchExpenses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Expense deleted" });
      fetchExpenses();
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-description">Total: Rs. {total.toLocaleString()} across {expenses.length} entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToPDF({
            title: "Expenses Report", headers: ["Title", "Amount", "Date", "Description"],
            rows: expenses.map((e) => [e.title, `Rs. ${Number(e.amount).toLocaleString()}`, format(new Date(e.expense_date), "dd MMM yyyy"), e.description || "—"]),
            filename: "expenses-report",
          })}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel({
            title: "Expenses", headers: ["Title", "Amount", "Date", "Description"],
            rows: expenses.map((e) => [e.title, Number(e.amount), format(new Date(e.expense_date), "dd MMM yyyy"), e.description || "—"]),
            filename: "expenses-report",
          })}><FileDown className="w-4 h-4 mr-1" />Excel</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Record Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount *</Label><Input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <Button type="submit" className="w-full">Record Expense</Button>
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
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expenses recorded</TableCell></TableRow>
              ) : expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium">{exp.title}</TableCell>
                  <TableCell className="font-semibold">Rs. {Number(exp.amount).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(exp.expense_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{exp.description || "—"}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{exp.title}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(exp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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

export default Expenses;