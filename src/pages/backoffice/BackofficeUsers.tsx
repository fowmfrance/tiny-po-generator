import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
  roles: string[];
}

const BackofficeUsers: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    const [{ data: profiles }, { data: roles }, { data: organizations }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('organizations').select('id, name'),
    ]);

    setOrgs(organizations as Organization[] ?? []);

    const orgMap: Record<string, string> = {};
    organizations?.forEach(o => { orgMap[o.id] = o.name; });

    const roleMap: Record<string, string[]> = {};
    roles?.forEach(r => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const merged = (profiles ?? []).map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      company: p.company,
      organization_id: p.organization_id,
      organization_name: p.organization_id ? (orgMap[p.organization_id] || null) : null,
      created_at: p.created_at,
      roles: roleMap[p.id] || ['user'],
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).neq('role', 'admin-sapajoo');
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rôle mis à jour' });
      fetchUsers();
    }
  };

  const handleOrgChange = async (userId: string, orgId: string) => {
    const value = orgId === '__none__' ? null : orgId;
    const { error } = await supabase.from('profiles').update({ organization_id: value }).eq('id', userId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Organisation mise à jour' });
      fetchUsers();
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    if (role === 'admin-sapajoo') return 'destructive';
    if (role === 'admin') return 'default';
    if (role === 'manager') return 'secondary';
    return 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground text-sm">Gestion cross-tenant des utilisateurs et permissions</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, email, société..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Société</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Modifier rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</TableCell></TableRow>
              ) : filtered.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || '—'}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.company || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(r => (
                        <Badge key={r} variant={roleColor(r)} className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!user.roles.includes('admin-sapajoo') && (
                      <Select
                        value={user.roles.find(r => r !== 'admin-sapajoo') || 'user'}
                        onValueChange={(v) => handleRoleChange(user.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeUsers;
