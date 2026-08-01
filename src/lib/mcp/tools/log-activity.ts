import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_activity",
  title: "Log activity",
  description: "Add an activity or announcement entry to the organisation's activity log.",
  inputSchema: {
    message: z.string().trim().min(1).describe("What happened."),
    activity_date: z.string().trim().optional().describe("Activity date (YYYY-MM-DD). Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ message, activity_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("activities")
      .insert({ message, activity_date, created_by: ctx.getUserId() })
      .select("id, message, activity_date, created_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { activity: data?.[0] ?? null },
    };
  },
});
