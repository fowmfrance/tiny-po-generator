// Géocodage des adresses de justificatifs via la BAN (Base Adresse Nationale,
// api-adresse.data.gouv.fr — gratuit, sans clé, France uniquement : les
// dépenses à l'étranger ne sont pas géocodées). Alimente merchant_lat/lng sur
// te_expenses, qui sert à la fois à la carte du reporting ET au signal
// « lieu » du moteur match-expense.
export async function geocodeBan(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (q.length < 8) return null;
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    // Score < 0.5 = correspondance douteuse : mieux vaut pas de point qu'un
    // point faux à l'autre bout de la France.
    if (!feat || (feat.properties?.score ?? 0) < 0.5) return null;
    const [lng, lat] = feat.geometry.coordinates as [number, number];
    return { lat, lng };
  } catch {
    return null;
  }
}
