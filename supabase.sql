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
