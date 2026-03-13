-- Table des contacts / leads 97import.com
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT,
  source TEXT DEFAULT 'contact',
  product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_source_idx ON contacts(source);

-- Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy : insertion publique (formulaires front)
CREATE POLICY "Insertion publique" ON contacts
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy : lecture admin seulement (à configurer avec Supabase Auth)
CREATE POLICY "Lecture admin" ON contacts
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE contacts IS 'Formulaires de contact reçus depuis 97import.com';
COMMENT ON COLUMN contacts.source IS 'Page d origine : contact, devis, produit, whatsapp, etc.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Table profiles (espace personnel client)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateur connecté voit uniquement son propre profil
CREATE POLICY "Lecture profil personnel" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Mise à jour : utilisateur connecté modifie uniquement son propre profil
CREATE POLICY "Modification profil personnel" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertion : lors de la création de compte (signUp)
CREATE POLICY "Insertion profil personnel" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

COMMENT ON TABLE profiles IS 'Profils des clients connectés sur 97import.com';

-- ─────────────────────────────────────────────────────────────────────────────
-- Table orders (historique des commandes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_name TEXT,
  amount NUMERIC(10, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateur connecté voit uniquement ses propres commandes
CREATE POLICY "Lecture commandes personnelles" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE orders IS 'Historique des commandes clients sur 97import.com';
