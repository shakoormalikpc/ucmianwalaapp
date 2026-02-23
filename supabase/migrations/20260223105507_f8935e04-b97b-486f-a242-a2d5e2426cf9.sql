
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view activities"
ON public.activities FOR SELECT
USING (is_authorized(auth.uid()));

CREATE POLICY "Only president can insert activities"
ON public.activities FOR INSERT
WITH CHECK (has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "Only president can delete activities"
ON public.activities FOR DELETE
USING (has_role(auth.uid(), 'president'::app_role));
