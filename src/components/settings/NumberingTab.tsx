import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Hash, Building2 } from 'lucide-react';

interface BudgetType {
  id: string;
  name: string;
  description: string;
  poFormat: string;
  currentSequence: number;
  isDefault: boolean;
  isActive: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

const NumberingTab = () => {
  const { toast } = useToast();
  
  // Mock data - will be replaced with Supabase queries
  const [budgetTypes, setBudgetTypes] = useState<BudgetType[]>([
    { id: '1', name: 'G&A', description: 'Frais généraux et administratifs', poFormat: 'GA-{YYYY}-{SEQ}', currentSequence: 42, isDefault: true, isActive: true },
    { id: '2', name: 'Projets', description: 'Budgets de projets spécifiques', poFormat: 'PRJ-{YYYY}-{SEQ}', currentSequence: 156, isDefault: false, isActive: true },
  ]);

  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Marketing', description: 'Équipe Marketing', color: '#EC4899', isActive: true },
    { id: '2', name: 'Développement', description: 'Équipe Développement', color: '#3B82F6', isActive: true },
    { id: '3', name: 'Finance', description: 'Équipe Finance', color: '#10B981', isActive: true },
    { id: '4', name: 'Opérations', description: 'Équipe Opérations', color: '#F59E0B', isActive: true },
    { id: '5', name: 'RH', description: 'Ressources Humaines', color: '#8B5CF6', isActive: true },
    { id: '6', name: 'Services Généraux', description: 'Services Généraux', color: '#6B7280', isActive: true },
  ]);

  const [isAddBudgetTypeOpen, setIsAddBudgetTypeOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [newBudgetType, setNewBudgetType] = useState({ name: '', description: '', poFormat: 'PO-{YYYY}-{SEQ}' });
  const [newTeam, setNewTeam] = useState({ name: '', description: '', color: '#6B7280' });

  const [globalPOFormat, setGlobalPOFormat] = useState('PO-{YYYY}-{SEQ}');
  const [usePerTypeFormat, setUsePerTypeFormat] = useState(true);

  const formatPreview = (format: string, seq: number = 1) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return format
      .replace('{YYYY}', String(year))
      .replace('{YY}', String(year).slice(-2))
      .replace('{MM}', month)
      .replace('{SEQ}', String(seq).padStart(4, '0'));
  };

  const handleAddBudgetType = () => {
    if (!newBudgetType.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le nom du type de budget est requis.",
      });
      return;
    }

    const newType: BudgetType = {
      id: String(Date.now()),
      name: newBudgetType.name,
      description: newBudgetType.description,
      poFormat: newBudgetType.poFormat,
      currentSequence: 0,
      isDefault: false,
      isActive: true,
    };

    setBudgetTypes([...budgetTypes, newType]);
    setNewBudgetType({ name: '', description: '', poFormat: 'PO-{YYYY}-{SEQ}' });
    setIsAddBudgetTypeOpen(false);

    toast({
      title: "Type de budget créé",
      description: `Le type "${newType.name}" a été ajouté avec succès.`,
    });
  };

  const handleAddTeam = () => {
    if (!newTeam.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le nom de l'équipe est requis.",
      });
      return;
    }

    const team: Team = {
      id: String(Date.now()),
      name: newTeam.name,
      description: newTeam.description,
      color: newTeam.color,
      isActive: true,
    };

    setTeams([...teams, team]);
    setNewTeam({ name: '', description: '', color: '#6B7280' });
    setIsAddTeamOpen(false);

    toast({
      title: "Équipe créée",
      description: `L'équipe "${team.name}" a été ajoutée avec succès.`,
    });
  };

  const handleDeleteBudgetType = (id: string) => {
    const type = budgetTypes.find(t => t.id === id);
    if (type?.isDefault) {
      toast({
        variant: "destructive",
        title: "Action non autorisée",
        description: "Vous ne pouvez pas supprimer le type de budget par défaut.",
      });
      return;
    }
    setBudgetTypes(budgetTypes.filter(t => t.id !== id));
    toast({
      title: "Type supprimé",
      description: "Le type de budget a été supprimé.",
    });
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
    toast({
      title: "Équipe supprimée",
      description: "L'équipe a été supprimée.",
    });
  };

  const handleSetDefaultType = (id: string) => {
    setBudgetTypes(budgetTypes.map(t => ({
      ...t,
      isDefault: t.id === id
    })));
    toast({
      title: "Type par défaut modifié",
      description: "Le type de budget par défaut a été mis à jour.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Global PO Format Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Format de numérotation des bons de commande
          </CardTitle>
          <CardDescription>
            Configurez le format de numérotation pour vos bons de commande.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="per-type-format">Format par type de budget</Label>
              <p className="text-sm text-muted-foreground">
                Utiliser un format différent pour chaque type de budget
              </p>
            </div>
            <Switch 
              id="per-type-format" 
              checked={usePerTypeFormat}
              onCheckedChange={setUsePerTypeFormat}
            />
          </div>

          {!usePerTypeFormat && (
            <div className="space-y-2">
              <Label htmlFor="global-format">Format global</Label>
              <div className="flex gap-2">
                <Input
                  id="global-format"
                  value={globalPOFormat}
                  onChange={(e) => setGlobalPOFormat(e.target.value)}
                  placeholder="PO-{YYYY}-{SEQ}"
                  className="max-w-xs"
                />
                <div className="flex items-center text-sm text-muted-foreground">
                  Aperçu: <span className="font-mono ml-2">{formatPreview(globalPOFormat)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {'{YYYY}'} (année), {'{YY}'} (année courte), {'{MM}'} (mois), {'{SEQ}'} (numéro séquentiel)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Types de budget</CardTitle>
              <CardDescription>
                Définissez les types de budget disponibles. Chaque type peut avoir son propre format de numérotation.
              </CardDescription>
            </div>
            <Dialog open={isAddBudgetTypeOpen} onOpenChange={setIsAddBudgetTypeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau type de budget</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau type de budget avec son propre compteur de numérotation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type-name">Nom</Label>
                    <Input
                      id="type-name"
                      value={newBudgetType.name}
                      onChange={(e) => setNewBudgetType({ ...newBudgetType, name: e.target.value })}
                      placeholder="Ex: Investissements"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-description">Description</Label>
                    <Input
                      id="type-description"
                      value={newBudgetType.description}
                      onChange={(e) => setNewBudgetType({ ...newBudgetType, description: e.target.value })}
                      placeholder="Ex: Budgets d'investissement"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-format">Format de numérotation</Label>
                    <Input
                      id="type-format"
                      value={newBudgetType.poFormat}
                      onChange={(e) => setNewBudgetType({ ...newBudgetType, poFormat: e.target.value })}
                      placeholder="INV-{YYYY}-{SEQ}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aperçu: <span className="font-mono">{formatPreview(newBudgetType.poFormat)}</span>
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddBudgetTypeOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddBudgetType}>
                    Créer le type
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Compteur actuel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">
                    {type.name}
                    {type.isDefault && (
                      <Badge variant="secondary" className="ml-2">Par défaut</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{type.description}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{type.poFormat}</code>
                    <span className="text-xs text-muted-foreground ml-2">
                      → {formatPreview(type.poFormat, type.currentSequence + 1)}
                    </span>
                  </TableCell>
                  <TableCell>{type.currentSequence}</TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!type.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultType(type.id)}
                        >
                          Définir par défaut
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteBudgetType(type.id)}
                        disabled={type.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Équipes / Fonctions
              </CardTitle>
              <CardDescription>
                Gérez les équipes ou fonctions auxquelles les budgets peuvent être affectés.
              </CardDescription>
            </div>
            <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une équipe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle équipe</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle équipe ou fonction.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Nom</Label>
                    <Input
                      id="team-name"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      placeholder="Ex: Commercial"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-description">Description</Label>
                    <Input
                      id="team-description"
                      value={newTeam.description}
                      onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                      placeholder="Ex: Équipe Commerciale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-color">Couleur</Label>
                    <div className="flex gap-2">
                      <Input
                        id="team-color"
                        type="color"
                        value={newTeam.color}
                        onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={newTeam.color}
                        onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                        placeholder="#6B7280"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddTeam}>
                    Créer l'équipe
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NumberingTab;
