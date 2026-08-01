import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_members",
  title: "List members",
  description:
    "List members, optionally filtered by name/rafaqat number search text or status. Returns membership and payment totals.",
  inputSchema: {
    search: z.string().trim().optional().describe("Match against member name or rafaqat number."),
    status: z.enum(["active", "inactive", "completed"]).optional().describe("Filter by member status."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("members")
      .select(
        "id, full_name, father_name, phone, rafaqat_no, membership_type, status, installment_option, paid_installments, total_installments, total_paid, total_required, remaining_amount, membership_start_date"
      )
      .order("full_name")
      .limit(limit ?? 50);
    if (status) query = query.eq("status", status);
    if (search) query = query.or(`full_name.ilike.%${search}%,rafaqat_no.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { members: data ?? [], count: data?.length ?? 0 },
    };
  },
});
