import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, members(full_name)")
        .order("payment_date", { ascending: false });
      setPayments(data || []);
    };
    fetch();
  }, []);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">All Payments</h1>
          <p className="page-description">Total: Rs. {total.toLocaleString()} from {payments.length} payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToPDF({
            title: "Payments Report", headers: ["Receipt #", "Member", "Amount", "Date", "Method"],
            rows: payments.map((p) => [p.receipt_number, (p.members as any)?.full_name || "—", `Rs. ${Number(p.amount).toLocaleString()}`, format(new Date(p.payment_date), "dd MMM yyyy"), p.payment_method || "—"]),
            filename: "payments-report",
          })}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel({
            title: "Payments", headers: ["Receipt #", "Member", "Amount", "Date", "Method"],
            rows: payments.map((p) => [p.receipt_number, (p.members as any)?.full_name || "—", Number(p.amount), format(new Date(p.payment_date), "dd MMM yyyy"), p.payment_method || "—"]),
            filename: "payments-report",
          })}><FileDown className="w-4 h-4 mr-1" />Excel</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                  <TableCell className="font-medium">{(p.members as any)?.full_name || "—"}</TableCell>
                  <TableCell className="font-semibold">Rs. {Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{p.payment_method || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
