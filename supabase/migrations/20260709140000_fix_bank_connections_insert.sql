-- Débloque la création de connexion bancaire (qonto-proxy → create_connection).
-- L'edge function n'insère que les colonnes chiffrées + user_id + bank_name, mais
-- la table exige aussi login, secret_key et organization_id en NOT NULL → 500.
--
-- login / secret_key sont des colonnes "legacy" en clair, remplacées par les
-- versions chiffrées : on les rend nullable.
-- organization_id est rempli automatiquement depuis profiles via un trigger
-- (l'insert est fait par le service role, sans auth.uid()). RLS = user_id, donc
-- un org null resterait sans risque de fuite.

ALTER TABLE public.bank_connections ALTER COLUMN login DROP NOT NULL;
ALTER TABLE public.bank_connections ALTER COLUMN secret_key DROP NOT NULL;
ALTER TABLE public.bank_connections ALTER COLUMN organization_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.set_bank_connection_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_bank_connection_org ON public.bank_connections;
CREATE TRIGGER trg_set_bank_connection_org
  BEFORE INSERT ON public.bank_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_bank_connection_org();
