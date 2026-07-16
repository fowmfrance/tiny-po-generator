import { supabase } from '@/integrations/supabase/client';

// Tracking du wizard « Aidez-moi à choisir » : voie utilisée (picklist vs wizard),
// parcours Q1/Q2, abandons par écran, modification manuelle post-wizard.
// Best-effort : la table recognition_wizard_events peut ne pas encore exister
// (migration Lovable Cloud à exécuter manuellement) — un échec d'insert ne doit
// jamais bloquer ni polluer le parcours utilisateur.

export type WizardEventName =
  | 'wizard_opened'
  | 'q1_answered'
  | 'q2_answered'
  | 'overview_opened'
  | 'result_viewed'
  | 'wizard_validated'
  | 'wizard_abandoned'
  | 'budget_created';

const sessionId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function logWizardEvent(event: WizardEventName, payload: Record<string, unknown> = {}) {
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from('recognition_wizard_events').insert({
        session_id: sessionId,
        user_id: user?.id ?? null,
        event,
        payload,
      });
    } catch {
      // Table absente ou RLS : on ne bloque jamais l'utilisateur pour du tracking.
    }
  })();
}
