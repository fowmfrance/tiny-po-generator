// Contrat d'ingestion des comptes clients depuis Kiosco (CRM maison).
// Charte « CRM passif » : source marquée (crm_source), identifiant externe
// conservé (crm_id), SIREN pivot dès qu'on l'a. Le transport réel (API ou
// export) n'est PAS branché — ce module fixe l'interface pour que l'import
// Qonto et l'import Kiosco convergent vers la même table `clients`.
import { supabase } from '@/integrations/supabase/client';
import { toProperCase } from '@/utils/properCase';
import { inferVatRegime, isVatRegime, type VatRegime } from '@/utils/vatRegimes';

// Colonnes clients hors types générés (migration 20261015120000 manuelle).
const db = supabase as any;

export interface KioscoClientPayload {
  kioscoId: string;
  name: string;
  legalName?: string;
  website?: string;
  siren?: string;
  vatNumber?: string;
  countryCode?: string; // FR, BE, CH…
  vatRegime?: VatRegime; // sinon déduit du pays
}

/**
 * Upsert d'un compte client Kiosco vers `clients`.
 * - `name` part brut : le trigger proper_case_name normalise en base.
 * - `legal_name` est normalisé ici (le trigger ne couvre que name) — properCase
 *   sur source brute uniquement, conformément à la doctrine.
 * - Dédup par (crm_source='kiosco', crm_id), sinon par SIREN.
 */
export async function upsertKioscoClient(payload: KioscoClientPayload, organizationId: string, userId: string) {
  const siren = payload.siren?.replace(/\D/g, '').slice(0, 9) || null;
  const row = {
    name: payload.name,
    legal_name: payload.legalName ? toProperCase(payload.legalName) : null,
    website: payload.website ?? null,
    siren,
    vat_number: payload.vatNumber?.replace(/\s/g, '') || null,
    crm_id: payload.kioscoId,
    crm_source: 'kiosco',
    vat_regime: isVatRegime(payload.vatRegime) ? payload.vatRegime : inferVatRegime(payload.countryCode),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await db.from('clients')
    .select('id')
    .or(`and(crm_source.eq.kiosco,crm_id.eq.${payload.kioscoId})${siren ? `,siren.eq.${siren}` : ''}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from('clients').update(row).eq('id', existing.id);
    if (error) throw error;
    return existing.id as string;
  }
  const { data, error } = await db.from('clients')
    .insert({ ...row, organization_id: organizationId, user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}
