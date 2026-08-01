import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_member",
  title: "Get member",
  description: "Get one member's full record together with their payment history, by member id.",
  inputSchema: {
    member_id: z.string().uuid().describe("The member's id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ member_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: member, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", member_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!member) return { content: [{ type: "text", text: "Member not found" }], isError: true };

    const { data: payments, error: payErr } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_method, receipt_number, remarks")
      .eq("member_id", member_id)
      .order("payment_date", { ascending: false });
    if (payErr) return { content: [{ type: "text", text: payErr.message }], isError: true };

    const result = { member, payments: payments ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
