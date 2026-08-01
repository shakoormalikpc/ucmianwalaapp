import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_activities",
  title: "List activities",
  description: "List logged organisation activities and announcements, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("activities")
      .select("id, message, activity_date, created_at")
      .order("activity_date", { ascending: false })
      .limit(limit ?? 30);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { activities: data ?? [], count: data?.length ?? 0 },
    };
  },
});
