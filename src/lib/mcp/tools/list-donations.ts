import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_donations",
  title: "List fund donations",
  description: "List fund donations, newest first, optionally within a date range.",
  inputSchema: {
    from_date: z.string().trim().optional().describe("Only donations on or after this date (YYYY-MM-DD)."),
    to_date: z.string().trim().optional().describe("Only donations on or before this date (YYYY-MM-DD)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("donations")
      .select("id, donor_name, amount, donation_date, contact_number, description")
      .order("donation_date", { ascending: false })
      .limit(limit ?? 50);
    if (from_date) query = query.gte("donation_date", from_date);
    if (to_date) query = query.lte("donation_date", to_date);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const total = (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { donations: data ?? [], count: data?.length ?? 0, total_amount: total },
    };
  },
});
