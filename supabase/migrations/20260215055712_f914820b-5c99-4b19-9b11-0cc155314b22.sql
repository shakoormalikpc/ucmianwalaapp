
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0;
