import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMembers from "./tools/list-members";
import getMember from "./tools/get-member";
import listPayments from "./tools/list-payments";
import recordPayment from "./tools/record-payment";
import listDonations from "./tools/list-donations";
import addDonation from "./tools/add-donation";
import fundSummary from "./tools/fund-summary";
import listActivities from "./tools/list-activities";
import logActivity from "./tools/log-activity";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "uc-fund-keeper",
  title: "UC Fund Keeper",
  version: "0.1.0",
  instructions:
    "Tools for UC Fund Keeper, a membership and fund management app. Use `list_members` and `get_member` to look up members and their payment history, `list_payments` and `record_payment` for membership payments, `list_donations` and `add_donation` for the fund, `fund_summary` for overall financial totals, and `list_activities` / `log_activity` for the activity log. All tools act as the signed-in user of the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMembers,
    getMember,
    listPayments,
    recordPayment,
    listDonations,
    addDonation,
    fundSummary,
    listActivities,
    logActivity,
  ],
});
