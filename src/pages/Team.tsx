import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  useOrgRoles,
  useOrgMembers,
  useOrgInvitations,
  useMyPermissions,
} from '@/hooks/useOrgTeam';

/**
 * Équipe de l'instance — trois onglets :
 * 1. Rôles : la grille de permissions (créer des budgets ? limite par BdC ?)
 * 2. Membres : membres actifs (rôle, dernière activité) + invitations
 * 3. KPIs : engagement par personne + top fournisseur (conflits d'intérêts)
 */
const Team = () => {
  const { data: perms } = useMyPermissions();
  const { roles, createRole, updateRole, deleteRole } = useOrgRoles();
  const { members, setMemberRole } = useOrgMembers();
  const { invitations, invite, revoke } = useOrgInvitations();

  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [kpiDays, setKpiDays] = useState('90');

  const isKeyUser = perms?.isKeyUser ?? false;
  const roleById = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);

  const fmtEur = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR') : 'Jamais';

  // ——— KPIs : BdC par personne sur la période ———
  const { data: kpis = [] } = useQuery({
    queryKey: ['team-kpis', kpiDays],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - Number(kpiDays));
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('user_id, total_amount, supplier_name, created_at, status')
        .gte('created_at', from.toISOString())
        .neq('status', 'cancelled');
      if (error) throw error;

      const byUser = new Map<string, { count: number; total: number; bySupplier: Map<string, number> }>();
      for (const po of data || []) {
        if (!po.user_id) continue;
        const entry = byUser.get(po.user_id) || { count: 0, total: 0, bySupplier: new Map() };
        const amount = Number(po.total_amount || 0);
        entry.count += 1;
        entry.total += amount;
        const supplier = po.supplier_name || 'Inconnu';
        entry.bySupplier.set(supplier, (entry.bySupplier.get(supplier) || 0) + amount);
        byUser.set(po.user_id, entry);
      }

      return Array.from(byUser.entries()).map(([userId, e]) => {
        const top = Array.from(e.bySupplier.entries()).sort((a, b) => b[1] - a[1])[0];
        return {
          userId,
          count: e.count,
          total: e.total,
          topSupplier: top?.[0] ?? null,
          topSupplierShare: top && e.total > 0 ? Math.round((top[1] / e.total) * 100) : 0,
        };
      }).sort((a, b) => b.total - a.total);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-gray-500">Rôles, membres et activité de votre instance.</p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
        </TabsList>

        {/* ————————————— Rôles ————————————— */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Grille des rôles</CardTitle>
              <CardDescription>
                Qui peut créer des budgets, et jusqu'à combien chaque rôle peut engager par bon de commande.
                Le key user administre l'instance sans limite.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-center">Créer des budgets</TableHead>
                    <TableHead className="text-right">Limite par BdC</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          {role.is_key_user && <ShieldCheck className="h-4 w-4 text-brand" />}
                          {role.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={role.can_create_budgets}
                          disabled={!isKeyUser || role.is_key_user}
                          onCheckedChange={(v) => updateRole.mutate({ id: role.id, canCreateBudgets: v })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {role.is_key_user ? (
                          <span className="text-sm text-muted-foreground">Illimité</span>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            disabled={!isKeyUser}
                            className="h-8 w-[130px] ml-auto text-right"
                            value={role.max_po_amount ?? ''}
                            placeholder="Illimité"
                            onChange={(e) => updateRole.mutate({
                              id: role.id,
                              maxPoAmount: e.target.value === '' ? null : Number(e.target.value),
                            })}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!role.is_key_user && isKeyUser && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Supprimer ce rôle"
                            onClick={() => deleteRole.mutate(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {isKeyUser && (
                <div className="flex items-end gap-2 max-w-md">
                  <div className="flex-1 space-y-1">
                    <span className="text-xs text-muted-foreground">Nouveau rôle</span>
                    <Input
                      value={newRoleLabel}
                      onChange={(e) => setNewRoleLabel(e.target.value)}
                      placeholder="ex. Assistant achats"
                    />
                  </div>
                  <Button
                    disabled={!newRoleLabel.trim() || createRole.isPending}
                    onClick={() => { createRole.mutate({ label: newRoleLabel.trim() }); setNewRoleLabel(''); }}
                  >
                    Ajouter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ————————————— Membres ————————————— */}
        <TabsContent value="members">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membres</CardTitle>
                <CardDescription>Les personnes de votre instance, leur rôle et leur dernière activité.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-right">Dernière activité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{m.fullName || m.email}</div>
                          {m.fullName && <div className="text-xs text-muted-foreground">{m.email}</div>}
                        </TableCell>
                        <TableCell>
                          {isKeyUser ? (
                            <Select
                              value={m.orgRoleId ?? ''}
                              onValueChange={(orgRoleId) => setMemberRole.mutate({ userId: m.id, orgRoleId })}
                            >
                              <SelectTrigger className="w-[180px] h-8">
                                <SelectValue placeholder="Sans rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary">
                              {m.orgRoleId ? (roleById.get(m.orgRoleId)?.label ?? '—') : 'Sans rôle'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {fmtDate(m.lastSeenAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                  Personnes invitées à rejoindre l'instance : elles obtiennent leur rôle en s'inscrivant avec l'email invité.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isKeyUser && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="prenom@entreprise.com"
                      />
                    </div>
                    <div className="w-[180px] space-y-1">
                      <span className="text-xs text-muted-foreground">Rôle</span>
                      <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                          {roles.filter(r => !r.is_key_user).map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={!inviteEmail.includes('@') || !inviteRoleId || invite.isPending}
                      onClick={() => { invite.mutate({ email: inviteEmail, orgRoleId: inviteRoleId }); setInviteEmail(''); }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Inviter
                    </Button>
                  </div>
                )}

                {invitations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Aucune invitation.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Invité le</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.email}</TableCell>
                          <TableCell>{inv.orgRoleId ? (roleById.get(inv.orgRoleId)?.label ?? '—') : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'accepted' ? 'default' : inv.status === 'revoked' ? 'destructive' : 'secondary'}>
                              {inv.status === 'pending' ? 'En attente' : inv.status === 'accepted' ? 'Acceptée' : 'Révoquée'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">{fmtDate(inv.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {isKeyUser && inv.status === 'pending' && (
                              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => revoke.mutate(inv.id)}>
                                Révoquer
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ————————————— KPIs ————————————— */}
        <TabsContent value="kpis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Activité par personne</CardTitle>
                  <CardDescription>
                    Engagements par membre, et concentration fournisseur — un top fournisseur
                    très dominant mérite un regard (conflit d'intérêts, fraude).
                  </CardDescription>
                </div>
                <Select value={kpiDays} onValueChange={setKpiDays}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 derniers jours</SelectItem>
                    <SelectItem value="90">90 derniers jours</SelectItem>
                    <SelectItem value="365">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {kpis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun BdC émis sur la période.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead className="text-right">BdC émis</TableHead>
                      <TableHead className="text-right">Montant engagé</TableHead>
                      <TableHead>Top fournisseur</TableHead>
                      <TableHead className="text-right">Part du top</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.map(k => {
                      const member = members.find(m => m.id === k.userId);
                      const concentrated = k.topSupplierShare >= 60 && k.count >= 3;
                      return (
                        <TableRow key={k.userId}>
                          <TableCell className="font-medium">
                            {member?.fullName || member?.email || 'Utilisateur inconnu'}
                          </TableCell>
                          <TableCell className="text-right">{k.count}</TableCell>
                          <TableCell className="text-right font-medium">{fmtEur(k.total)}</TableCell>
                          <TableCell>{k.topSupplier || '—'}</TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center gap-1 ${concentrated ? 'text-red-600 font-medium' : ''}`}>
                              {concentrated && <AlertTriangle className="h-3.5 w-3.5" />}
                              {k.topSupplierShare}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Team;
