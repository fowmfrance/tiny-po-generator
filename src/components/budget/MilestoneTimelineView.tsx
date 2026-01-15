import React, { useState, useMemo, useRef } from 'react';
import { format, differenceInDays, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plus, 
  Trash2, 
  CalendarDays, 
  Flag, 
  CheckCircle2, 
  User, 
  Link2, 
  Link2Off,
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface MilestoneWithSupplier {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  isCompleted: boolean;
  orderIndex: number;
  supplierId?: string | null;
  supplierName?: string;
}

interface Supplier {
  id: string;
  name: string;
  specialty?: string;
}

interface MilestoneTimelineViewProps {
  milestones: MilestoneWithSupplier[];
  onMilestonesChange: (milestones: MilestoneWithSupplier[]) => void;
  projectStartDate?: Date;
  projectEndDate?: Date;
  suppliers?: Supplier[];
  readOnly?: boolean;
  showCompact?: boolean;
}

export const MilestoneTimelineView: React.FC<MilestoneTimelineViewProps> = ({
  milestones,
  onMilestonesChange,
  projectStartDate,
  projectEndDate,
  suppliers = [],
  readOnly = false,
  showCompact = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneSupplierId, setNewMilestoneSupplierId] = useState<string>('none');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!showCompact);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate percentages based on milestone count
  const calculatePercentages = (items: MilestoneWithSupplier[]): MilestoneWithSupplier[] => {
    const totalMilestones = items.length;
    if (totalMilestones === 0) return items;
    
    const percentagePerMilestone = 100 / totalMilestones;
    
    return items.map((item, index) => ({
      ...item,
      completionPercentage: Math.round(percentagePerMilestone * (index + 1) * 100) / 100,
      orderIndex: index,
    }));
  };

  // Handle click on timeline to select date
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !projectStartDate || !projectEndDate) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    const totalDays = differenceInDays(projectEndDate, projectStartDate);
    const daysFromStart = Math.round(totalDays * percentage);
    const clickedDate = startOfDay(addDays(projectStartDate, daysFromStart));
    
    // Ensure date is within bounds
    if (clickedDate >= projectStartDate && clickedDate <= projectEndDate) {
      setSelectedDate(clickedDate);
    }
  };

  // Add milestone at selected date
  const handleAddMilestone = () => {
    if (!selectedDate || !newMilestoneTitle.trim()) return;

    const supplier = suppliers.find(s => s.id === newMilestoneSupplierId);
    
    const milestone: MilestoneWithSupplier = {
      id: crypto.randomUUID(),
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      targetDate: selectedDate,
      completionPercentage: 0,
      isCompleted: false,
      orderIndex: milestones.length,
      supplierId: newMilestoneSupplierId !== 'none' ? newMilestoneSupplierId : null,
      supplierName: supplier?.name,
    };

    const updatedMilestones = calculatePercentages(
      [...milestones, milestone].sort((a, b) => 
        a.targetDate.getTime() - b.targetDate.getTime()
      )
    );

    onMilestonesChange(updatedMilestones);
    setSelectedDate(null);
    setNewMilestoneTitle('');
    setNewMilestoneDescription('');
    setNewMilestoneSupplierId('none');
  };

  // Remove milestone
  const handleRemoveMilestone = (id: string) => {
    const updatedMilestones = calculatePercentages(
      milestones.filter(m => m.id !== id)
    );
    onMilestonesChange(updatedMilestones);
  };

  // Update milestone supplier
  const handleUpdateSupplier = (milestoneId: string, supplierId: string | null) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId 
        ? { 
            ...m, 
            supplierId: supplierId || null,
            supplierName: supplier?.name 
          } 
        : m
    );
    onMilestonesChange(updatedMilestones);
    setEditingMilestoneId(null);
  };

  // Calculate timeline positions
  const timelineData = useMemo(() => {
    if (!projectStartDate || !projectEndDate) {
      return { totalDays: 0, milestonePositions: [], selectedPosition: null };
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

    let selectedPosition = null;
    if (selectedDate) {
      const daysFromStart = differenceInDays(selectedDate, projectStartDate);
      selectedPosition = totalDays > 0 ? (daysFromStart / totalDays) * 100 : 0;
    }

    return { totalDays, milestonePositions, selectedPosition };
  }, [milestones, projectStartDate, projectEndDate, selectedDate]);

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalProgress = milestones.length > 0 
    ? (completedCount / milestones.length) * 100 
    : 0;

  // Compact view for display in forms
  if (showCompact && !expanded) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <span className="font-medium">Jalons du projet (Milestones)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{milestones.length} livrable(s)</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
            >
              <Flag className="h-4 w-4 mr-1" />
              Modifier ({milestones.length} jalons)
            </Button>
          </div>
        </div>
        
        {milestones.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">Jalons définis</p>
            {milestones.slice(0, 3).map((m, i) => (
              <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <span>{m.title}</span>
                  {m.supplierName && (
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {m.supplierName}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {format(m.targetDate, 'dd/MM/yyyy')}
                </span>
              </div>
            ))}
            {milestones.length > 3 && (
              <button 
                onClick={() => setExpanded(true)}
                className="text-xs text-primary hover:underline"
              >
                + {milestones.length - 3} autre(s) jalon(s)
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with collapse button */}
      {showCompact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <span className="font-medium">Jalons du projet (Milestones)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-4 w-4" />
            Réduire
          </Button>
        </div>
      )}

      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avancement global</span>
            <span className="font-medium">
              {completedCount}/{milestones.length} jalons ({totalProgress.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive Timeline */}
      {projectStartDate && projectEndDate && (
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{format(projectStartDate, 'dd MMM yyyy', { locale: fr })}</span>
            <span>{format(projectEndDate, 'dd MMM yyyy', { locale: fr })}</span>
          </div>
          
          {/* Timeline bar - clickable */}
          <TooltipProvider>
            <div 
              ref={timelineRef}
              className={cn(
                "relative h-16 rounded-lg transition-colors",
                !readOnly && "cursor-crosshair hover:bg-muted/50"
              )}
              onClick={handleTimelineClick}
              style={{ background: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)' }}
            >
              {/* Base line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-border rounded-full -translate-y-1/2" />
              
              {/* Progress line */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary rounded-full -translate-y-1/2 transition-all"
                style={{ width: `${totalProgress}%` }}
              />
              
              {/* Selected date marker */}
              {selectedDate && timelineData.selectedPosition !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                  style={{ left: `${timelineData.selectedPosition}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground shadow-lg animate-pulse flex items-center justify-center">
                    <Plus className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border">
                    {format(selectedDate, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              )}
              
              {/* Milestone markers */}
              {timelineData.milestonePositions.map((m, i) => (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                      style={{ left: `${m.position}%` }}
                    >
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all cursor-pointer",
                          m.isCompleted 
                            ? "bg-green-500 border-green-600" 
                            : m.supplierId
                              ? "bg-blue-500 border-blue-600"
                              : "bg-background border-muted-foreground/40 hover:border-primary hover:scale-110"
                        )}
                      >
                        {m.isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-white m-auto" />
                        )}
                        {!m.isCompleted && m.supplierId && (
                          <User className="w-3 h-3 text-white m-auto" />
                        )}
                      </div>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
                        #{i + 1}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(m.targetDate, 'dd/MM/yyyy')}
                      </p>
                      {m.supplierName && (
                        <p className="text-xs text-blue-500">
                          <User className="w-3 h-3 inline mr-1" />
                          {m.supplierName}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
          
          {!readOnly && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Cliquez sur la timeline pour sélectionner une date et ajouter un jalon
            </p>
          )}
        </div>
      )}

      {/* Add milestone form (appears when date selected) */}
      {selectedDate && !readOnly && (
        <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 space-y-4 bg-primary/5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nouveau jalon - {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
            >
              Annuler
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Titre du livrable *</Label>
              <Input
                id="milestone-title"
                placeholder="ex: Post Instagram #1"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Fournisseur (optionnel)</Label>
              <Select
                value={newMilestoneSupplierId}
                onValueChange={setNewMilestoneSupplierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Aucun fournisseur</span>
                  </SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {supplier.name}
                        {supplier.specialty && (
                          <span className="text-xs text-muted-foreground">
                            ({supplier.specialty})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous pourrez rattacher un fournisseur ultérieurement
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="milestone-desc">Description (optionnel)</Label>
            <Textarea
              id="milestone-desc"
              placeholder="Décrivez ce livrable..."
              value={newMilestoneDescription}
              onChange={(e) => setNewMilestoneDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <Button 
            onClick={handleAddMilestone}
            disabled={!newMilestoneTitle.trim()}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter ce jalon
          </Button>
        </div>
      )}

      {/* Milestones list */}
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
                {!readOnly && (
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{milestone.title}</span>
                    {milestone.isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {milestone.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {format(milestone.targetDate, 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-xs font-medium">
                      → {milestone.completionPercentage.toFixed(0)}% d'avancement
                    </span>
                    
                    {/* Supplier badge/selector */}
                    {editingMilestoneId === milestone.id ? (
                      <Select
                        value={milestone.supplierId || 'none'}
                        onValueChange={(value) => handleUpdateSupplier(milestone.id, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="h-7 w-48 text-xs">
                          <SelectValue placeholder="Lier un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun fournisseur</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : milestone.supplierId ? (
                      <Badge 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={() => !readOnly && setEditingMilestoneId(milestone.id)}
                      >
                        <User className="h-3 w-3 mr-1" />
                        {milestone.supplierName}
                        {!readOnly && <Link2Off className="h-3 w-3 ml-1 opacity-50" />}
                      </Badge>
                    ) : !readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground"
                        onClick={() => setEditingMilestoneId(milestone.id)}
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Lier fournisseur
                      </Button>
                    )}
                  </div>
                </div>
                
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveMilestone(milestone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {milestones.length === 0 && !selectedDate && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun jalon défini</p>
          {!readOnly && projectStartDate && projectEndDate && (
            <p className="text-sm mt-1">
              Cliquez sur la timeline ci-dessus pour ajouter un jalon
            </p>
          )}
        </div>
      )}
    </div>
  );
};
