-- ============================================================
-- FIX RLS — TOUTES les tables admin (quotes, partners, etc.)
-- 🔴 À exécuter dans Supabase SQL Editor
-- Diagnostic : ANON_KEY + RLS activé = 0 résultats silencieux
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. DIAGNOSTIC — Vérifier l'état RLS de chaque table
-- ─────────────────────────────────────────────────────────────
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname IN ('quotes', 'partners', 'profiles', 'contacts', 'site_content', 'invoices');

-- ─────────────────────────────────────────────────────────────
-- 1. TABLE QUOTES — Policies manquantes
-- ─────────────────────────────────────────────────────────────

-- Admin + collaborateur : lecture complète
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

-- Admin + collaborateur : gestion complète (insert, update, delete)
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

-- Clients : lecture de leurs propres devis (par email)
CREATE POLICY IF NOT EXISTS "user_read_own_quotes"
ON quotes FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Insertion publique (formulaire de devis côté client)
CREATE POLICY IF NOT EXISTS "public_insert_quotes"
ON quotes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insertion anonyme (formulaire sans compte)
CREATE POLICY IF NOT EXISTS "anon_insert_quotes"
ON quotes FOR INSERT
TO anon
WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2. TABLE PARTNERS — Policies manquantes
-- ─────────────────────────────────────────────────────────────

-- Vérifier si les policies existent déjà (setup-partners.sql les crée)
-- Si "Admin gere partenaires" existe déjà, ces CREATE seront ignorées

CREATE POLICY IF NOT EXISTS "admin_read_all_partners"
ON partners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

CREATE POLICY IF NOT EXISTS "admin_manage_all_partners"
ON partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- ─────────────────────────────────────────────────────────────
-- 3. TABLE SITE_CONTENT — Lecture publique
-- ─────────────────────────────────────────────────────────────

CREATE POLICY IF NOT EXISTS "public_read_site_content"
ON site_content FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "admin_manage_site_content"
ON site_content FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- ─────────────────────────────────────────────────────────────
-- 4. TABLE INVOICES — Admin seulement
-- ─────────────────────────────────────────────────────────────

CREATE POLICY IF NOT EXISTS "admin_manage_invoices"
ON invoices FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- ─────────────────────────────────────────────────────────────
-- 5. TABLE CONTACTS — Insertion publique + lecture admin
-- ─────────────────────────────────────────────────────────────

CREATE POLICY IF NOT EXISTS "public_insert_contacts"
ON contacts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "admin_read_contacts"
ON contacts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'collaborateur')
  )
);

-- ============================================================
-- ALTERNATIVE RAPIDE : Désactiver RLS sur quotes et partners
-- (moins sécurisé mais résout le problème immédiatement)
-- ============================================================
-- ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;
-- ============================================================
