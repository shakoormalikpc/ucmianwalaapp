import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_payment",
  title: "Record payment",
  description: "Record a membership payment for a member. Creates a new payment row.",
  inputSchema: {
    member_id: z.string().uuid().describe("The member the payment belongs to."),
    amount: z.number().positive().describe("Payment amount."),
    payment_date: z.string().trim().optional().describe("Payment date (YYYY-MM-DD). Defaults to today."),
    payment_method: z.string().trim().optional().describe("How the payment was made, e.g. cash or bank."),
    remarks: z.string().trim().optional().describe("Optional note about this payment."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ member_id, amount, payment_date, payment_method, remarks }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("payments")
      .insert({
        member_id,
        amount,
        payment_date,
        payment_method,
        remarks,
        created_by: ctx.getUserId(),
      })
      .select("id, member_id, amount, payment_date, payment_method, receipt_number, remarks");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { payment: data?.[0] ?? null },
    };
  },
});
