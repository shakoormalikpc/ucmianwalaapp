
-- Create membership type enum
CREATE TYPE public.membership_type AS ENUM ('annual', 'life');

-- Create member status enum
CREATE TYPE public.member_status AS ENUM ('active', 'pending_payment', 'completed');

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('president', 'nazim');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Members table
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    father_name TEXT,
    phone TEXT,
    cnic TEXT,
    address TEXT,
    membership_type membership_type NOT NULL,
    membership_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    installment_option BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    total_required NUMERIC NOT NULL DEFAULT 0,
    total_paid NUMERIC NOT NULL DEFAULT 0,
    remaining_amount NUMERIC GENERATED ALWAYS AS (total_required - total_paid) STORED,
    status member_status NOT NULL DEFAULT 'pending_payment',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    receipt_number TEXT NOT NULL UNIQUE,
    remarks TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Donations table
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name TEXT NOT NULL,
    contact_number TEXT,
    amount NUMERIC NOT NULL,
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any valid role
CREATE OR REPLACE FUNCTION public.is_authorized(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Authorized users can view profiles" ON public.profiles
FOR SELECT USING (public.is_authorized(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for members (both roles can view and insert)
CREATE POLICY "Authorized users can view members" ON public.members
FOR SELECT USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert members" ON public.members
FOR INSERT WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can update members" ON public.members
FOR UPDATE USING (public.is_authorized(auth.uid()));

CREATE POLICY "Only president can delete members" ON public.members
FOR DELETE USING (public.has_role(auth.uid(), 'president'));

-- RLS Policies for payments
CREATE POLICY "Authorized users can view payments" ON public.payments
FOR SELECT USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert payments" ON public.payments
FOR INSERT WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Only president can update payments" ON public.payments
FOR UPDATE USING (public.has_role(auth.uid(), 'president'));

CREATE POLICY "Only president can delete payments" ON public.payments
FOR DELETE USING (public.has_role(auth.uid(), 'president'));

-- RLS Policies for donations
CREATE POLICY "Authorized users can view donations" ON public.donations
FOR SELECT USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert donations" ON public.donations
FOR INSERT WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Only president can update donations" ON public.donations
FOR UPDATE USING (public.has_role(auth.uid(), 'president'));

CREATE POLICY "Only president can delete donations" ON public.donations
FOR DELETE USING (public.has_role(auth.uid(), 'president'));

-- RLS Policies for expenses
CREATE POLICY "Authorized users can view expenses" ON public.expenses
FOR SELECT USING (public.is_authorized(auth.uid()));

CREATE POLICY "Authorized users can insert expenses" ON public.expenses
FOR INSERT WITH CHECK (public.is_authorized(auth.uid()));

CREATE POLICY "Only president can update expenses" ON public.expenses
FOR UPDATE USING (public.has_role(auth.uid(), 'president'));

CREATE POLICY "Only president can delete expenses" ON public.expenses
FOR DELETE USING (public.has_role(auth.uid(), 'president'));

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_receipt_number
BEFORE INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.generate_receipt_number();

-- Function to update member total_paid after payment
CREATE OR REPLACE FUNCTION public.update_member_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.members SET total_paid = total_paid + NEW.amount,
      status = CASE
        WHEN total_paid + NEW.amount >= total_required THEN 'completed'::member_status
        ELSE 'pending_payment'::member_status
      END,
      updated_at = now()
    WHERE id = NEW.member_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.members SET total_paid = total_paid - OLD.amount,
      status = CASE
        WHEN total_paid - OLD.amount >= total_required THEN 'completed'::member_status
        WHEN total_paid - OLD.amount > 0 THEN 'pending_payment'::member_status
        ELSE 'pending_payment'::member_status
      END,
      updated_at = now()
    WHERE id = OLD.member_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_member_on_payment
AFTER INSERT OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_member_payment();

-- Trigger to auto-set total_required based on membership type
CREATE OR REPLACE FUNCTION public.set_membership_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_type = 'annual' THEN
    NEW.total_required := 1000;
  ELSIF NEW.membership_type = 'life' THEN
    NEW.total_required := 6000;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_membership_amount_trigger
BEFORE INSERT ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.set_membership_amount();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
