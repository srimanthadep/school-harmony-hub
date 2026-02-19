
-- Insert demo admin role for seeded users
-- Note: Demo users need to be created via auth, then roles assigned.
-- We'll create a function to assign roles easily.

CREATE OR REPLACE FUNCTION public.assign_user_role(_email TEXT, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
