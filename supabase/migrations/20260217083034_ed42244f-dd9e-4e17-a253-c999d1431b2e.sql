
CREATE OR REPLACE FUNCTION public.set_membership_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only override total_required if it's not already set (i.e., default 0)
  -- This allows the application to set custom amounts for installment plans
  IF NEW.total_required IS NULL OR NEW.total_required = 0 THEN
    IF NEW.membership_type = 'annual' THEN
      NEW.total_required := 1000;
    ELSIF NEW.membership_type = 'life' THEN
      NEW.total_required := 6000;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
