// Recherche d'entreprises via l'API publique recherche-entreprises.api.gouv.fr
// (base SIRENE/INSEE, gratuite, sans clé — même API que le scanner Fleuron).
// Accepte un nom, un SIREN (9 chiffres) ou un SIRET (14 chiffres).

export interface SireneDirigeant {
  nom: string | null;
  prenoms: string | null;
  qualite: string | null;
  denomination?: string | null;
  type_dirigeant: string;
}

export interface SireneSiege {
  siret: string;
  adresse: string | null;
  numero_voie: string | null;
  indice_repetition: string | null;
  type_voie: string | null;
  libelle_voie: string | null;
  complement_adresse: string | null;
  code_postal: string | null;
  libelle_commune: string | null;
  etat_administratif: string | null;
}

export interface SireneCompany {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string | null;
  sigle: string | null;
  siege: SireneSiege;
  activite_principale: string | null; // code NAF
  nature_juridique: string | null;
  date_creation: string | null;
  etat_administratif: string | null; // "A" = active, "C" = cessée
  statut_diffusion: string | null;
  nombre_etablissements_ouverts: number | null;
  dirigeants: SireneDirigeant[];
}

// Champs applicables à une fiche fournisseur (table suppliers)
export interface SirenePrefill {
  name: string;
  siren: string;
  siret: string;
  vat_number: string;
  address: string;
  city: string;
  country: string;
}

// Libellés des formes juridiques les plus courantes (nomenclature INSEE niveau III)
const NATURE_JURIDIQUE_LABELS: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5410': 'SARL',
  '5422': 'SARL',
  '5498': 'EURL',
  '5499': 'SARL',
  '5510': 'SA',
  '5599': 'SA',
  '5710': 'SAS',
  '5720': 'SASU',
  '5785': 'SELAS',
  '6540': 'SCI',
  '6598': 'EARL',
  '6599': 'Société civile',
  '9220': 'Association',
};

export function natureJuridiqueLabel(code: string | null): string | null {
  if (!code) return null;
  return NATURE_JURIDIQUE_LABELS[code] || null;
}

export function formatSiren(siren: string): string {
  return siren.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

export function formatSiret(siret: string): string {
  return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
}

// N° TVA intracommunautaire français : FR + clé (2 chiffres) + SIREN
export function computeVatFromSiren(siren: string): string {
  const num = Number(siren);
  if (!Number.isFinite(num) || siren.length !== 9) return '';
  const key = (12 + 3 * (num % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-zà-ÿ])/g, (_, sep, c) => sep + c.toUpperCase());
}

// Rue seule (sans CP/ville), reconstruite depuis les champs du siège
export function siegeStreet(siege: SireneSiege): string {
  const parts = [siege.numero_voie, siege.indice_repetition, siege.type_voie, siege.libelle_voie]
    .filter(Boolean)
    .join(' ');
  const withComplement = [parts, siege.complement_adresse].filter(Boolean).join(', ');
  if (withComplement) return titleCase(withComplement);
  // Fallback : adresse complète en retirant "CP VILLE"
  if (siege.adresse) {
    const stripped = siege.adresse
      .replace(new RegExp(`\\s*${siege.code_postal || ''}\\s*${siege.libelle_commune || ''}\\s*$`, 'i'), '')
      .trim();
    return titleCase(stripped || siege.adresse);
  }
  return '';
}

export function mapToSupplierPrefill(company: SireneCompany): SirenePrefill {
  const siege = company.siege;
  return {
    name: company.nom_raison_sociale || company.nom_complet,
    siren: company.siren,
    siret: siege?.siret || '',
    vat_number: computeVatFromSiren(company.siren),
    address: siege ? siegeStreet(siege) : '',
    city: siege ? [siege.code_postal, siege.libelle_commune ? titleCase(siege.libelle_commune) : null].filter(Boolean).join(' ') : '',
    country: 'France',
  };
}

export async function searchSirene(query: string, signal?: AbortSignal): Promise<SireneCompany[]> {
  // Un SIREN/SIRET saisi avec des espaces doit partir sans espaces
  const q = /^[\d\s]+$/.test(query) ? query.replace(/\s+/g, '') : query.trim();
  if (q.length < 3) return [];

  const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=8&page=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 400) return []; // requête trop courte / invalide côté API
    throw new Error(`Registre SIRENE indisponible (HTTP ${res.status})`);
  }
  const data = await res.json();
  return (data.results || []) as SireneCompany[];
}
