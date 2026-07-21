/**
 * Met un nom de tiers au « format propre » : capitalise chaque mot, en
 * préservant les acronymes / formes juridiques courtes tout en majuscules
 * (SARL, SAS, EI, SA, EURL, RH…). Gère traits d'union, apostrophes, etc.
 *
 * Ex. « FRANCOIS TOUCHARD EI » → « Francois Touchard EI »
 *     « DUPONT-DURAND SARL »   → « Dupont-Durand SARL »
 *     « l'atelier du son »     → « L'Atelier Du Son »
 */

// Tokens tout-en-majuscules à conserver tels quels (acronymes / statuts).
const KEEP_UPPER = new Set([
  'SARL', 'SARLU', 'SAS', 'SASU', 'EURL', 'SA', 'SCI', 'SCOP', 'SNC',
  'EI', 'EIRL', 'SC', 'SCM', 'GIE', 'RH', 'IT', 'BTP', 'CB',
  'PME', 'TPE', 'CE', 'CSE',
]);

/** Capitalise un « mot » (suite de lettres/chiffres), en gardant les acronymes connus. */
function capitalizeWord(word: string): string {
  const upper = word.toUpperCase();
  // On ne préserve QUE les acronymes/statuts connus : un libellé bancaire tout
  // en majuscules (« JEAN MARTIN ») doit bien devenir « Jean Martin ».
  if (KEEP_UPPER.has(upper)) return upper;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toProperCase(raw: string): string {
  if (!raw) return raw;
  const src = raw.trim().replace(/\s+/g, ' ');

  // Nom d'un seul mot de 4 caractères ou moins, tout en majuscules : acronyme
  // présumé (EDF, SNCF, MUA, MHCS). On n'y touche pas — impossible à distinguer
  // d'une raison sociale par une liste, qu'il faudrait maintenir à la main.
  if (src === src.toUpperCase() && /^[\p{L}\p{N}]{1,4}$/u.test(src)) return src;

  // Remplace chaque suite de lettres/chiffres ; laisse intacts espaces, traits
  // d'union, apostrophes, etc. Chaque « mot » est capitalisé indépendamment.
  return src.replace(/[\p{L}\p{N}]+/gu, (word) => capitalizeWord(word));
}
