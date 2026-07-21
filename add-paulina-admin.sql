-- Pridėti paulina@piksel.lt prie admin RLS (is_piksel_admin).
-- Paleisk Supabase → SQL Editor, jei dar naudojate senas politikas su el. pašto sąrašu.
-- Jei jau paleistas fix-security-advisor-rls.sql — pakanka atnaujinti funkciją žemiau.

CREATE OR REPLACE FUNCTION public.is_piksel_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((select auth.jwt() ->> 'email'), '') IN (
    'admin@piksel.lt',
    'renatas@piksel.lt',
    'romanas@piksel.lt',
    'paulina@piksel.lt'
  );
$$;
