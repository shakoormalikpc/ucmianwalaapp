-- 1. Activities: explicit UPDATE policy (president only)
CREATE POLICY "Only president can update activities"
ON public.activities
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'president'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'president'::app_role));

-- 2. user_roles: explicit write policies (president only)
CREATE POLICY "Only president can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "Only president can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'president'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "Only president can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'president'::app_role));

CREATE POLICY "President can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'president'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 3. Revoke EXECUTE on SECURITY DEFINER trigger functions from API roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_member_payment() FROM PUBLIC, anon, authenticated;

-- Helper functions: keep usable by signed-in users only (needed by RLS policies), block anon
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_authorized(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized(uuid) TO authenticated;

-- Non-definer trigger functions should not be API-callable either
REVOKE ALL ON FUNCTION public.generate_receipt_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_membership_amount() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;