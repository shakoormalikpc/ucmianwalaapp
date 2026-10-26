CREATE TYPE public.fund_account_type AS ENUM ('cash', 'bank');

CREATE TABLE public.fund_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_type public.fund_account_type NOT NULL DEFAULT 'cash',
  bank_name text,
  account_number text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fund_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  funder_name text NOT NULL,
  amount numeric NOT NULL,
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  fund_account_id uuid REFERENCES public.fund_accounts(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fund_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  fund_account_id uuid REFERENCES public.fund_accounts(id) ON DELETE SET NULL,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT USAGE ON TYPE public.fund_account_type TO authenticated, service_role;
GRANT SELECT, INSERT ON public.fund_accounts TO authenticated;
GRANT SELECT, INSERT ON public.fund_contributions TO authenticated;
GRANT SELECT, INSERT ON public.fund_expenses TO authenticated;
GRANT ALL ON public.fund_accounts TO service_role;
GRANT ALL ON public.fund_contributions TO service_role;
GRANT ALL ON public.fund_expenses TO service_role;

ALTER TABLE public.fund_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view fund accounts" ON public.fund_accounts FOR SELECT TO public USING (is_authorized(auth.uid()));
CREATE POLICY "Authorized users can add fund accounts" ON public.fund_accounts FOR INSERT TO public WITH CHECK (is_authorized(auth.uid()));
CREATE POLICY "Only president can update fund accounts" ON public.fund_accounts FOR UPDATE TO public USING (has_role(auth.uid(), 'president'::app_role)) WITH CHECK (has_role(auth.uid(), 'president'::app_role));
CREATE POLICY "Only president can delete fund accounts" ON public.fund_accounts FOR DELETE TO public USING (has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "Authorized users can view fund contributions" ON public.fund_contributions FOR SELECT TO public USING (is_authorized(auth.uid()));
CREATE POLICY "Authorized users can add fund contributions" ON public.fund_contributions FOR INSERT TO public WITH CHECK (is_authorized(auth.uid()));
CREATE POLICY "Only president can update fund contributions" ON public.fund_contributions FOR UPDATE TO public USING (has_role(auth.uid(), 'president'::app_role)) WITH CHECK (has_role(auth.uid(), 'president'::app_role));
CREATE POLICY "Only president can delete fund contributions" ON public.fund_contributions FOR DELETE TO public USING (has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "Authorized users can view fund expenses" ON public.fund_expenses FOR SELECT TO public USING (is_authorized(auth.uid()));
CREATE POLICY "Authorized users can add fund expenses" ON public.fund_expenses FOR INSERT TO public WITH CHECK (is_authorized(auth.uid()));
CREATE POLICY "Only president can update fund expenses" ON public.fund_expenses FOR UPDATE TO public USING (has_role(auth.uid(), 'president'::app_role)) WITH CHECK (has_role(auth.uid(), 'president'::app_role));
CREATE POLICY "Only president can delete fund expenses" ON public.fund_expenses FOR DELETE TO public USING (has_role(auth.uid(), 'president'::app_role));