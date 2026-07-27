// Carte des lieux de dépense (onglet Reporting du module Notes de frais).
// Marqueurs = frais géocodés (merchant_lat/lng, posés à la vérification via la
// BAN) ; CircleMarker SVG uniquement — pas d'icônes PNG Leaflet, dont les
// chemins cassent avec Vite. Le bouton « Géocoder » rattrape les frais qui ont
// une adresse mais pas encore de point (anciens frais, adresse SIRENE).
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { geocodeBan } from './geocode';

const db = supabase as any;

// Accent terracotta Sapajoo (--brand) — Leaflet ne résout pas les variables CSS
// dans les attributs SVG, on fige le hex.
const BRAND = '#D97757';

export interface MapExpense {
  id: string;
  merchant_clean: string | null;
  merchant_raw: string | null;
  amount: number;
  occurred_at: string;
  supplier_address?: string | null;
  merchant_lat?: number | null;
  merchant_lng?: number | null;
  is_abroad?: boolean;
}

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// Recadre la carte sur les points affichés (réagit aux filtres du reporting).
const FitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 15 });
  }, [map, points]);
  return null;
};

interface Props {
  expenses: MapExpense[];
  onOpenExpense: (id: string) => void;
  /** Recharger les frais après un géocodage (les points viennent de la DB). */
  onDataChanged?: () => void;
}

const FraisMap: React.FC<Props> = ({ expenses, onOpenExpense, onDataChanged }) => {
  const { toast } = useToast();
  const [geocoding, setGeocoding] = useState(false);

  const located = useMemo(
    () => expenses.filter((e) => e.merchant_lat != null && e.merchant_lng != null),
    [expenses]);
  // Géocodables : une adresse mais pas de point, et pas à l'étranger (la BAN
  // ne couvre que la France).
  const missing = useMemo(
    () => expenses.filter((e) =>
      e.merchant_lat == null && (e.supplier_address ?? '').trim() && !e.is_abroad),
    [expenses]);

  const points = useMemo(
    () => located.map((e) => [e.merchant_lat!, e.merchant_lng!] as [number, number]),
    [located]);

  // Un même resto revient souvent : rayon du marqueur ∝ total dépensé au lieu.
  const totalsByPoint = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of located) {
      const k = `${e.merchant_lat},${e.merchant_lng}`;
      m.set(k, (m.get(k) ?? 0) + (Number(e.amount) || 0));
    }
    return m;
  }, [located]);
  const maxTotal = Math.max(1, ...totalsByPoint.values());

  const geocodeMissing = async () => {
    setGeocoding(true);
    let ok = 0;
    let failed = 0;
    // Séquentiel : la BAN est rapide et ça reste poli pour l'API publique.
    for (const e of missing) {
      const coords = await geocodeBan(e.supplier_address!);
      if (!coords) { failed += 1; continue; }
      const { error } = await db.from('te_expenses')
        .update({ merchant_lat: coords.lat, merchant_lng: coords.lng })
        .eq('id', e.id);
      if (error) failed += 1; else ok += 1;
    }
    setGeocoding(false);
    toast({
      title: 'Géocodage terminé',
      description: `${ok} adresse${ok > 1 ? 's' : ''} placée${ok > 1 ? 's' : ''} sur la carte` +
        (failed ? ` · ${failed} introuvable${failed > 1 ? 's' : ''} (adresse imprécise ?)` : '') + '.',
    });
    if (ok) onDataChanged?.();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Carte des lieux{located.length > 0 && ` (${located.length})`}
          </span>
          {missing.length > 0 && (
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
              onClick={geocodeMissing} disabled={geocoding}>
              {geocoding
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <MapPin className="h-3.5 w-3.5 mr-1.5" />}
              Géocoder {missing.length} adresse{missing.length > 1 ? 's' : ''}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {located.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Aucun frais géolocalisé sur la période. Les points se créent à la
            vérification d'un justificatif dont l'adresse est renseignée
            (OCR ou SIRENE){missing.length > 0 ? ' — ou via le bouton « Géocoder » ci-dessus' : ''}.
          </div>
        ) : (
          <div className="h-[340px] rounded-lg overflow-hidden border">
            <MapContainer
              center={points[0]}
              zoom={12}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={points} />
              {located.map((e) => {
                const total = totalsByPoint.get(`${e.merchant_lat},${e.merchant_lng}`) ?? 0;
                const radius = 6 + 10 * Math.sqrt(total / maxTotal);
                return (
                  <CircleMarker
                    key={e.id}
                    center={[e.merchant_lat!, e.merchant_lng!]}
                    radius={radius}
                    pathOptions={{ color: BRAND, fillColor: BRAND, fillOpacity: 0.35, weight: 1.5 }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">
                        {e.merchant_clean ?? e.merchant_raw ?? 'Marchand inconnu'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(e.occurred_at), 'd MMM yyyy', { locale: fr })} · {euro(Number(e.amount))}
                      </div>
                      <button
                        type="button"
                        className="text-xs underline mt-1"
                        onClick={() => onOpenExpense(e.id)}
                      >
                        Voir le frais
                      </button>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FraisMap;
