# Référentiel TVA & catégories — module Notes de frais

> Résultat de la veille open source du 2026-07-17. Décision : **embarquer un
> référentiel statique** (seed SQL/JSON) plutôt qu'une dépendance — les valeurs
> bougent au plus une fois par an (loi de finances + arrêté barème IK).

## Sources open source retenues

| Projet | Licence | Ce qu'on reprend |
|---|---|---|
| [Dolibarr — `llx_c_type_fees.sql`](https://github.com/Dolibarr/dolibarr/blob/develop/htdocs/install/mysql/data/llx_c_type_fees.sql) | GPL-3 (données factuelles réutilisables, **pas le code**) | 22 codes de catégories FR + mapping PCG en commentaire (625100 IK, 606150 carburant, 625160 hôtel/repas/péage/parking…) ; distinction véhicule société (CV) / personnel (VP) qui pilote la récupérabilité TVA |
| [Dolibarr — `llx_expensereport_ik`](https://github.com/Dolibarr/dolibarr/blob/develop/htdocs/install/mysql/data/llx_expensereport_ik-expensereport.sql) | GPL-3 | **Structure** du barème IK : catégorie fiscale (3/4/5/6/7+ CV) × tranche (0/5 000/20 000 km) × (coefficient, offset). ⚠️ valeurs 2017, ne pas reprendre les chiffres |
| [tresor4k/bareme-kilometrique-france-2022-2026](https://github.com/tresor4k/bareme-kilometrique-france-2022-2026) | **CC BY 4.0** | CSV 135 lignes, déclarations 2022→2026, autos/motos/cyclos + majoration électrique, sourcé Légifrance (JORFTEXT000045160753, JORFTEXT000047416556). Embarquable avec attribution — contrôler 3-4 lignes contre l'arrêté avant import (repo récent) |
| [Club-Alpin-Lyon-Villeurbanne/plateforme-club-alpin](https://github.com/Club-Alpin-Lyon-Villeurbanne/plateforme-club-alpin) | **MIT** | Seule appli FR de prod open source avec NDF sous licence permissive (front Vue) — inspiration formulaires/workflow |
| [OCA/hr-expense](https://github.com/OCA/hr-expense) | AGPL-3 | Inspiration workflow uniquement (avances, validation à paliers) — pas de référentiel FR dedans |
| [valeriansaliou/node-sales-tax](https://github.com/valeriansaliou/node-sales-tax) | MIT | Optionnel : validation de n° TVA intracom (VIES). Inutile pour les taux |

Constat : **le croisement catégorie × taux × récupérabilité n'existe nulle part
en open source** (Dolibarr = saisie libre, Odoo = config). C'est le tableau
ci-dessous, à encoder nous-mêmes (≈40 lignes de JSON).

## Tableau TVA par catégorie (France, sourcé BOFiP/CGI)

| Catégorie | Taux usuel | TVA récupérable | Base légale |
|---|---|---|---|
| Repas restaurant (mission) | 10 % nourriture/soft + 20 % alcool | **Oui 100 %** (facture au nom de l'entreprise au-delà de 150 € HT) | BOI-TVA-DED-30-30-10 |
| Repas invitation clients | 10 % / 20 % | Oui — noter les invités sur le justificatif | idem |
| Hôtel / hébergement (salarié, dirigeant) | 10 % | **Non, jamais** (tiers : oui ; petit-déj facturé à part : oui) | CGI ann. II art. 206, IV-2-2° |
| Carburant essence/gazole — véhicule de tourisme | 20 % | **80 %** | CGI art. 298 |
| Carburant — utilitaire | 20 % | 100 % | idem |
| Électricité (recharge VE), GPL | 20 % | 100 % (même VP pour l'électricité) | idem |
| Péage | 20 % | Oui 100 % (même en VP) | BOI-TVA-DED-30-30-20 |
| Parking (déplacement pro) | 20 % | Oui (hors parking habituel domicile/bureau) | idem |
| Taxi/VTC, train, avion | 10 % taxi ; train/avion souvent exonéré | **Non** (exclusion transport de personnes) | CGI ann. II art. 206, IV-2-5° |
| Location + entretien véhicule de tourisme | 20 % | **Non** (utilitaire : oui) | CGI ann. II art. 206, IV-2-6° |
| Indemnités kilométriques | — | Sans objet (forfait) | barème art. 6B ann. IV CGI |
| Cadeaux clients | 20 % | Oui si ≤ 73 € TTC/an/bénéficiaire | CGI ann. II art. 206, IV-2-3° |
| Fournitures, documentation, télécom | 20 % (5,5 % livres) | Oui 100 % | droit commun |

## Plan d'intégration (à faire)

1. Table `te_expense_types` (seed SQL) : code (inspiré Dolibarr), libellé FR,
   `te_category` (mapping vers restaurant/transport/hebergement/autre du matching),
   `vat_rate_default`, `vat_recovery_rate` (0 / 0.8 / 1), `pcg_account`,
   flag `vehicle_ownership` (société/personnel) le cas échéant.
2. Import du CSV barème IK (CC BY 4.0, attribution en commentaire de seed) dans
   `te_mileage_rates` — hors périmètre v1 (IK explicitement hors scope), à garder
   sous le coude pour v2.
3. L'OCR pourra alors proposer type + TVA (il lit déjà la TVA du ticket) et le
   récap DAF affichera la TVA récupérable par frais.
