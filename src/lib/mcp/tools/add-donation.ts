import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_donation",
  title: "Add fund donation",
  description: "Record a new donation into the fund.",
  inputSchema: {
    donor_name: z.string().trim().min(1).describe("Name of the donor."),
    amount: z.number().positive().describe("Donated amount."),
    donation_date: z.string().trim().optional().describe("Donation date (YYYY-MM-DD). Defaults to today."),
    contact_number: z.string().trim().optional().describe("Donor contact number."),
    description: z.string().trim().optional().describe("Optional note about this donation."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ donor_name, amount, donation_date, contact_number, description }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("donations")
      .insert({
        donor_name,
        amount,
        donation_date,
        contact_number,
        description,
        created_by: ctx.getUserId(),
      })
      .select("id, donor_name, amount, donation_date, contact_number, description");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { donation: data?.[0] ?? null },
    };
  },
});
