// Monogramme fournisseur : initiales + couleur stable dérivée du nom.
// Palette douce, cohérente avec les tokens (fonds clairs, texte foncé).

const PALETTE = [
  { bg: '#FBEFEA', fg: '#B4471F' }, // terracotta
  { bg: '#E6F1FB', fg: '#185FA5' }, // bleu
  { bg: '#E1F5EE', fg: '#0F6E56' }, // teal
  { bg: '#F1EFE8', fg: '#5F5E5A' }, // gris chaud
  { bg: '#FAEEDA', fg: '#854F0B' }, // ambre
  { bg: '#EEEDFE', fg: '#3C3489' }, // violet
];

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function getMonogramColor(name?: string | null): { bg: string; fg: string } {
  const s = name || '';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
