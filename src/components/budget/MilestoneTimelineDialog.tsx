import React, { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, CalendarDays, Flag, CheckCircle2, AlertCircle, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  isCompleted: boolean;
  orderIndex: number;
}

interface MilestoneTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
  projectStartDate?: Date;
  projectEndDate?: Date;
}

export const MilestoneTimelineDialog: React.FC<MilestoneTimelineDialogProps> = ({
  open,
  onOpenChange,
  milestones,
  onMilestonesChange,
  projectStartDate,
  projectEndDate,
}) => {
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: new Date(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Calcul automatique des pourcentages basé sur le nombre de milestones
  const calculatePercentages = (items: Milestone[]): Milestone[] => {
    const totalMilestones = items.length;
    if (totalMilestones === 0) return items;
    
    const percentagePerMilestone = 100 / totalMilestones;
    
    return items.map((item, index) => ({
      ...item,
      completionPercentage: Math.round(percentagePerMilestone * (index + 1) * 100) / 100,
      orderIndex: index,
    }));
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) return;

    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      completionPercentage: 0,
      isCompleted: false,
      orderIndex: milestones.length,
    };

    // Ajouter et recalculer les pourcentages
    const updatedMilestones = calculatePercentages(
      [...milestones, milestone].sort((a, b) => 
        a.targetDate.getTime() - b.targetDate.getTime()
      )
    );

    onMilestonesChange(updatedMilestones);
    setNewMilestone({ title: '', description: '', targetDate: new Date() });
  };

  const handleRemoveMilestone = (id: string) => {
    const updatedMilestones = calculatePercentages(
      milestones.filter(m => m.id !== id)
    );
    onMilestonesChange(updatedMilestones);
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    const updatedMilestones = milestones.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    
    // Re-trier si la date a changé
    if (updates.targetDate) {
      const sorted = calculatePercentages(
        updatedMilestones.sort((a, b) => 
          a.targetDate.getTime() - b.targetDate.getTime()
        )
      );
      onMilestonesChange(sorted);
    } else {
      onMilestonesChange(updatedMilestones);
    }
    setEditingId(null);
  };

  // Calcul de la timeline visuelle
  const timelineData = useMemo(() => {
    if (!projectStartDate || !projectEndDate || milestones.length === 0) {
      return { totalDays: 0, milestonePositions: [] };
    }

    const totalDays = differenceInDays(projectEndDate, projectStartDate);
    
    const milestonePositions = milestones.map(m => {
      const daysFromStart = differenceInDays(m.targetDate, projectStartDate);
      const position = totalDays > 0 ? (daysFromStart / totalDays) * 100 : 0;
      return {
        ...m,
        position: Math.max(0, Math.min(100, position)),
      };
    });

    return { totalDays, milestonePositions };
  }, [milestones, projectStartDate, projectEndDate]);

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalProgress = milestones.length > 0 
    ? (completedCount / milestones.length) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Définir les jalons du projet (Milestones)
          </DialogTitle>
          <DialogDescription>
            Ajoutez les livrables attendus avec leurs dates cibles. Le système calculera automatiquement 
            l'avancement basé sur le nombre de jalons complétés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Barre de progression globale */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avancement global</span>
                <span className="font-medium">{completedCount}/{milestones.length} jalons ({totalProgress.toFixed(0)}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Timeline visuelle */}
          {projectStartDate && projectEndDate && milestones.length > 0 && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(projectStartDate, 'dd MMM yyyy', { locale: fr })}</span>
                <span>{format(projectEndDate, 'dd MMM yyyy', { locale: fr })}</span>
              </div>
              <div className="relative h-8">
                {/* Ligne de base */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted-foreground/20 rounded-full -translate-y-1/2" />
                
                {/* Progression */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-primary rounded-full -translate-y-1/2 transition-all"
                  style={{ width: `${totalProgress}%` }}
                />
                
                {/* Points de milestone */}
                {timelineData.milestonePositions.map((m, i) => (
                  <div
                    key={m.id}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${m.position}%` }}
                  >
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-colors cursor-pointer",
                        m.isCompleted 
                          ? "bg-primary border-primary" 
                          : "bg-background border-muted-foreground/40 hover:border-primary"
                      )}
                      title={`${m.title} - ${format(m.targetDate, 'dd/MM/yyyy')}`}
                    >
                      {m.isCompleted && (
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground m-auto" />
                      )}
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-4" /> {/* Spacer pour les numéros */}
            </div>
          )}

          {/* Formulaire d'ajout */}
          <div className="border rounded-lg p-4 space-y-4 bg-background">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un jalon
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-title">Titre du livrable</Label>
                <Input
                  id="milestone-title"
                  placeholder="ex: Post Instagram #1"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date cible</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newMilestone.targetDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {newMilestone.targetDate 
                        ? format(newMilestone.targetDate, 'PPP', { locale: fr })
                        : "Sélectionner une date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newMilestone.targetDate}
                      onSelect={(date) => date && setNewMilestone(prev => ({ ...prev, targetDate: date }))}
                      disabled={(date) => {
                        if (projectStartDate && date < projectStartDate) return true;
                        if (projectEndDate && date > projectEndDate) return true;
                        return false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-desc">Description (optionnel)</Label>
              <Textarea
                id="milestone-desc"
                placeholder="Décrivez ce livrable..."
                value={newMilestone.description}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <Button 
              onClick={handleAddMilestone}
              disabled={!newMilestone.title.trim()}
              className="w-full md:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter ce jalon
            </Button>
          </div>

          {/* Liste des milestones */}
          {milestones.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Jalons définis ({milestones.length})</h4>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div 
                    key={milestone.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      milestone.isCompleted 
                        ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
                        : "bg-background hover:bg-muted/30"
                    )}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                    
                    <div className="flex-1 min-w-0">
                      {editingId === milestone.id ? (
                        <div className="space-y-2">
                          <Input
                            value={milestone.title}
                            onChange={(e) => handleUpdateMilestone(milestone.id, { title: e.target.value })}
                            autoFocus
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CalendarDays className="h-3 w-3 mr-1" />
                                {format(milestone.targetDate, 'PPP', { locale: fr })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={milestone.targetDate}
                                onSelect={(date) => date && handleUpdateMilestone(milestone.id, { targetDate: date })}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                              #{index + 1}
                            </span>
                            <span 
                              className="font-medium cursor-pointer hover:text-primary"
                              onClick={() => setEditingId(milestone.id)}
                            >
                              {milestone.title}
                            </span>
                            {milestone.isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(milestone.targetDate, 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="font-medium text-foreground">
                              → {milestone.completionPercentage.toFixed(0)}% d'avancement
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message informatif */}
          {milestones.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun jalon défini</p>
              <p className="text-sm">Ajoutez des livrables pour suivre l'avancement du projet</p>
            </div>
          )}

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Calcul automatique de l'avancement</p>
              <p className="mt-1 text-blue-600 dark:text-blue-300">
                L'avancement est calculé proportionnellement au nombre de jalons. 
                Avec {milestones.length || 'N'} jalons, chaque livrable représente {milestones.length > 0 ? (100 / milestones.length).toFixed(1) : '—'}% d'avancement.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Valider les jalons ({milestones.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
