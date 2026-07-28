-- Reconnaissance du revenu : LINÉAIRE PAR DÉFAUT sur tous les projets.
--
-- Règle produit (Clement, 2026-07-28) : CA, coûts et provisions sont reconnus
-- linéairement entre la date de début et la date de fin du projet, sur TOUS
-- les projets. Les experts (key user d'une instance) peuvent affiner la
-- méthode si besoin — le choix/changement de méthode est réservé au key user
-- côté app (RecognitionMethodCard, ChangeRecognitionMethodDialog), en plus du
-- verrou existant « méthode figée après première écriture reconnue ».
--
-- 8ee98649-b925-486d-8606-47257bf8b94e = recognition_methods 'over_time_linear'
-- (ligne is_system, stable).
--
-- ✅ EXÉCUTÉE en prod le 2026-07-28 via le connecteur Lovable.

alter table public.budgets
  alter column recognition_method_id
  set default '8ee98649-b925-486d-8606-47257bf8b94e';

-- Backfill : les budgets sans méthode passent en linéaire.
update public.budgets
set recognition_method_id = '8ee98649-b925-486d-8606-47257bf8b94e'
where recognition_method_id is null;
