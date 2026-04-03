-- ============================================================
-- FIX RLS pour la table quotes
-- A exécuter dans Supabase SQL Editor SI les devis ne s'affichent pas
-- ============================================================

-- 1. Vérifier si RLS est activé
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'quotes';

-- 2. Si RLS activé mais aucune policy : ajouter la policy admin
CREATE POLICY IF NOT EXISTS "admin_read_all_quotes"
ON quotes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- 3. Policy pour que les admins puissent modifier les devis
CREATE POLICY IF NOT EXISTS "admin_manage_all_quotes"
ON quotes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- 4. Policy pour que les clients voient leurs propres devis
CREATE POLICY IF NOT EXISTS "user_read_own_quotes"
ON quotes FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- 5. Policy pour insertion publique (formulaire de devis)
CREATE POLICY IF NOT EXISTS "public_insert_quotes"
ON quotes FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================
-- ALTERNATIVE : Si vous voulez désactiver RLS sur quotes
-- ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
-- ============================================================
