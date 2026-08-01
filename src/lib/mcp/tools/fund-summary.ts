import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "fund_summary",
  title: "Fund summary",
  description:
    "Summarise the organisation's finances: member counts, total membership payments, donations, expenses and the resulting balance.",
  inputSchema: {
    from_date: z.string().trim().optional().describe("Only count records on or after this date (YYYY-MM-DD)."),
    to_date: z.string().trim().optional().describe("Only count records on or before this date (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const sum = (rows: { amount: number | null }[] | null) =>
      (rows ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);

    const range = <T extends { gte: Function; lte: Function }>(query: T, column: string) => {
      let q: any = query;
      if (from_date) q = q.gte(column, from_date);
      if (to_date) q = q.lte(column, to_date);
      return q;
    };

    const [payments, donations, expenses, members] = await Promise.all([
      range(supabase.from("payments").select("amount"), "payment_date"),
      range(supabase.from("donations").select("amount"), "donation_date"),
      range(supabase.from("expenses").select("amount"), "expense_date"),
      supabase.from("members").select("status, total_paid, total_required, remaining_amount"),
    ]);

    const failure = [payments, donations, expenses, members].find((r: any) => r.error);
    if (failure) return { content: [{ type: "text", text: (failure as any).error.message }], isError: true };

    const memberRows = (members.data ?? []) as {
      status: string;
      total_paid: number | null;
      total_required: number | null;
      remaining_amount: number | null;
    }[];

    const totalPayments = sum(payments.data as any);
    const totalDonations = sum(donations.data as any);
    const totalExpenses = sum(expenses.data as any);

    const summary = {
      members_total: memberRows.length,
      members_active: memberRows.filter((m) => m.status === "active").length,
      total_payments: totalPayments,
      total_donations: totalDonations,
      total_expenses: totalExpenses,
      balance: totalPayments + totalDonations - totalExpenses,
      outstanding_from_members: memberRows.reduce(
        (t, m) => t + Number(m.remaining_amount ?? 0),
        0
      ),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
