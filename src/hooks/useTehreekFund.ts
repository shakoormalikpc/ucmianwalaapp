import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FUND_UPDATED_EVENT = "tehreek-fund-updated";

export const notifyFundUpdated = () => {
  window.dispatchEvent(new Event(FUND_UPDATED_EVENT));
};

export interface FundAccount {
  id: string;
  name: string;
  account_type: "cash" | "bank";
  bank_name: string | null;
  account_number: string | null;
  notes: string | null;
}

export interface FundTotals {
  totalContributions: number;
  totalExpenses: number;
  balance: number;
  accounts: FundAccount[];
  accountBalances: Record<string, number>;
  loading: boolean;
}

const empty: FundTotals = {
  totalContributions: 0,
  totalExpenses: 0,
  balance: 0,
  accounts: [],
  accountBalances: {},
  loading: true,
};

/**
 * Shared Tehreek Fund totals. Used by the sidebar (always visible) and the
 * Tehreek Fund page. Any mutation should call notifyFundUpdated() so every
 * mounted listener refetches.
 */
export const useTehreekFund = (): FundTotals => {
  const [state, setState] = useState<FundTotals>(empty);

  const fetchTotals = useCallback(async () => {
    const [contribRes, expRes, accRes] = await Promise.all([
      supabase.from("fund_contributions").select("amount, fund_account_id"),
      supabase.from("fund_expenses").select("amount, fund_account_id"),
      supabase.from("fund_accounts").select("id, name, account_type, bank_name, account_number, notes").order("created_at", { ascending: true }),
    ]);

    const contributions = contribRes.data || [];
    const expenses = expRes.data || [];
    const accounts = (accRes.data as FundAccount[]) || [];

    const totalContributions = contributions.reduce((s, c) => s + Number(c.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const accountBalances: Record<string, number> = {};
    accounts.forEach((a) => { accountBalances[a.id] = 0; });
    contributions.forEach((c) => {
      if (c.fund_account_id && c.fund_account_id in accountBalances) {
        accountBalances[c.fund_account_id] += Number(c.amount);
      }
    });
    expenses.forEach((e) => {
      if (e.fund_account_id && e.fund_account_id in accountBalances) {
        accountBalances[e.fund_account_id] -= Number(e.amount);
      }
    });

    setState({
      totalContributions,
      totalExpenses,
      balance: totalContributions - totalExpenses,
      accounts,
      accountBalances,
      loading: false,
    });
  }, []);

  useEffect(() => {
    fetchTotals();
    window.addEventListener(FUND_UPDATED_EVENT, fetchTotals);
    return () => window.removeEventListener(FUND_UPDATED_EVENT, fetchTotals);
  }, [fetchTotals]);

  return state;
};
