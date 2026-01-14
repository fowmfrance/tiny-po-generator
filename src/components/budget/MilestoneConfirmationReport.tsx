import React, { useState } from 'react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Flag,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  isCompleted: boolean;
  orderIndex: number;
}

interface Project {
  id: string;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

interface MilestoneConfirmationReportProps {
  projects: Project[];
  onConfirmMilestone: (projectId: string, milestoneId: string, isOnTime: boolean, newDate?: Date, notes?: string) => void;
}

export const MilestoneConfirmationReport: React.FC<MilestoneConfirmationReportProps> = ({
  projects,
  onConfirmMilestone,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    projectId: string;
    milestone: Milestone;
  } | null>(null);
  const [newDate, setNewDate] = useState<Date>();
  const [notes, setNotes] = useState('');

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getPendingMilestones = (project: Project) => {
    return project.milestones.filter(m => !m.isCompleted);
  };

  const getOverdueMilestones = (project: Project) => {
    return project.milestones.filter(m => !m.isCompleted && isPast(m.targetDate) && !isToday(m.targetDate));
  };

  const getDueTodayMilestones = (project: Project) => {
    return project.milestones.filter(m => !m.isCompleted && isToday(m.targetDate));
  };

  const getUpcomingMilestones = (project: Project) => {
    return project.milestones.filter(m => {
      if (m.isCompleted) return false;
      const daysUntil = differenceInDays(m.targetDate, new Date());
      return daysUntil > 0 && daysUntil <= 7;
    });
  };

  const handleConfirmOnTime = (projectId: string, milestone: Milestone) => {
    onConfirmMilestone(projectId, milestone.id, true);
  };

  const handleOpenReschedule = (projectId: string, milestone: Milestone) => {
    setRescheduleDialog({ projectId, milestone });
    setNewDate(undefined);
    setNotes('');
  };

  const handleConfirmReschedule = () => {
    if (rescheduleDialog && newDate) {
      onConfirmMilestone(
        rescheduleDialog.projectId,
        rescheduleDialog.milestone.id,
        false,
        newDate,
        notes
      );
      setRescheduleDialog(null);
    }
  };

  const projectsWithPendingMilestones = projects.filter(p => getPendingMilestones(p).length > 0);

  if (projectsWithPendingMilestones.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium">Tous les jalons sont confirmés !</h3>
          <p className="text-muted-foreground mt-2">
            Aucun livrable en attente de confirmation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapport de confirmation des jalons
          </h2>
          <p className="text-muted-foreground text-sm">
            {projectsWithPendingMilestones.length} projet(s) avec des livrables en attente
          </p>
        </div>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {projects.reduce((acc, p) => acc + getOverdueMilestones(p).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {projects.reduce((acc, p) => acc + getDueTodayMilestones(p).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.reduce((acc, p) => acc + getUpcomingMilestones(p).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {projects.reduce((acc, p) => acc + p.milestones.filter(m => m.isCompleted).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Complétés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des projets */}
      <div className="space-y-3">
        {projectsWithPendingMilestones.map(project => {
          const overdue = getOverdueMilestones(project);
          const dueToday = getDueTodayMilestones(project);
          const upcoming = getUpcomingMilestones(project);
          const isExpanded = expandedProjects.includes(project.id);
          const completed = project.milestones.filter(m => m.isCompleted).length;
          const total = project.milestones.length;
          const progress = (completed / total) * 100;

          return (
            <Card key={project.id} className={cn(
              overdue.length > 0 && "border-red-300"
            )}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleProject(project.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flag className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {project.code} - {project.name}
                            {overdue.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {overdue.length} en retard
                              </Badge>
                            )}
                            {dueToday.length > 0 && (
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                {dueToday.length} aujourd'hui
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {format(project.startDate, 'dd/MM/yyyy')} → {format(project.endDate, 'dd/MM/yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-sm font-medium">{completed}/{total} jalons</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {project.milestones
                        .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
                        .map((milestone, index) => {
                          const isOverdue = !milestone.isCompleted && isPast(milestone.targetDate) && !isToday(milestone.targetDate);
                          const isDueToday = !milestone.isCompleted && isToday(milestone.targetDate);
                          const daysOverdue = isOverdue ? differenceInDays(new Date(), milestone.targetDate) : 0;

                          return (
                            <div 
                              key={milestone.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                milestone.isCompleted && "bg-green-50/50 border-green-200 dark:bg-green-950/20",
                                isOverdue && "bg-red-50/50 border-red-200 dark:bg-red-950/20",
                                isDueToday && "bg-orange-50/50 border-orange-200 dark:bg-orange-950/20"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                  #{index + 1}
                                </span>
                                <div>
                                  <p className="font-medium flex items-center gap-2">
                                    {milestone.title}
                                    {milestone.isCompleted && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <CalendarDays className="h-3 w-3" />
                                    {format(milestone.targetDate, 'dd MMM yyyy', { locale: fr })}
                                    {isOverdue && (
                                      <span className="text-red-600">
                                        ({daysOverdue} jour{daysOverdue > 1 ? 's' : ''} de retard)
                                      </span>
                                    )}
                                    {isDueToday && (
                                      <span className="text-orange-600">(Aujourd'hui)</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {!milestone.isCompleted && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                    onClick={() => handleConfirmOnTime(project.id, milestone)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Confirmer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                    onClick={() => handleOpenReschedule(project.id, milestone)}
                                  >
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    Recaler
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Dialog de reschedule */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Recaler le jalon
            </DialogTitle>
            <DialogDescription>
              Le jalon "{rescheduleDialog?.milestone.title}" n'a pas été livré à temps. 
              Indiquez la nouvelle date réaliste.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouvelle date cible</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newDate 
                      ? format(newDate, 'PPP', { locale: fr })
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-notes">Raison du report</Label>
              <Textarea
                id="reschedule-notes"
                placeholder="Expliquez pourquoi ce jalon est reporté..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog(null)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmReschedule} disabled={!newDate}>
              Confirmer le report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
