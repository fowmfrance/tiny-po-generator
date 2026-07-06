import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  siret: string | null;
  plan: string;
  status: string;
  max_users: number;
  contact_email: string | null;
  contact_name: string | null;
  created_at: string;
}

const BackofficeOrganizations: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteOrg, setInviteOrg] = useState<Organization | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'admin' });
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: '', siret: '', plan: 'starter', max_users: '5', contact_email: '', contact_name: '' });
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!inviteOrg) return;
    setInviting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('invite-org-user', {
      body: { email: inviteForm.email, full_name: inviteForm.full_name, organization_id: inviteOrg.id, role: inviteForm.role },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setInviting(false);
    if (res.error || res.data?.error) {
      toast({ title: 'Erreur', description: res.error?.message || res.data?.error, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation envoyée', description: `${inviteForm.email} a reçu un email d'invitation.` });
      setInviteOrg(null);
      setInviteForm({ email: '', full_name: '', role: 'admin' });
    }
  };

  const fetchOrgs = async () => {
    const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    setOrgs((data as Organization[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleCreate = async () => {
    const { error } = await supabase.from('organizations').insert({
      name: form.name,
      siret: form.siret || null,
      plan: form.plan,
      max_users: parseInt(form.max_users) || 5,
      contact_email: form.contact_email || null,
      contact_name: form.contact_name || null,
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Organisation créée' });
      setDialogOpen(false);
      setForm({ name: '', siret: '', plan: 'starter', max_users: '5', contact_email: '', contact_name: '' });
      fetchOrgs();
    }
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'default';
    if (s === 'suspended') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="text-muted-foreground text-sm">Gestion des sociétés clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nouvelle organisation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une organisation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>SIRET</Label><Input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={v => setForm(f => ({ ...f, plan: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Max utilisateurs</Label><Input type="number" value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))} /></div>
              </div>
              <div><Label>Email contact</Label><Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div><Label>Nom contact</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead>SIRET</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Max users</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : orgs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune organisation</TableCell></TableRow>
              ) : orgs.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{org.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{org.siret || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{org.plan}</Badge></TableCell>
                  <TableCell><Badge variant={statusColor(org.status)} className="capitalize">{org.status}</Badge></TableCell>
                  <TableCell>{org.max_users}</TableCell>
                  <TableCell className="text-sm">{org.contact_email || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeOrganizations;
