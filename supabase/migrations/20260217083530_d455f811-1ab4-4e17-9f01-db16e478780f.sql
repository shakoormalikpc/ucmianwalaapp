
CREATE OR REPLACE FUNCTION public.set_membership_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.membership_type = 'annual' THEN
    NEW.total_required := 1000;
  ELSIF NEW.membership_type = 'life' THEN
    NEW.total_required := 6000;
  END IF;
  RETURN NEW;
END;
$function$;
