import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flag, Pencil, CheckCircle2, Clock, Target } from 'lucide-react';
import { MilestoneTimelineDialog, Milestone } from '@/components/budget/MilestoneTimelineDialog';
import { MilestoneMode } from '@/models/Budget';
import { Progress } from '@/components/ui/progress';

interface RecognitionMethod {
  id: string;
  code: string;
  name_expense: string;
  name_revenue: string;
  description: string;
  trigger_type: string;
}

interface MilestoneData {
  id: string;
  title: string;
  description: string | null;
  target_date: string;
  completed_date: string | null;
  completion_percentage: number;
  is_completed: boolean;
  order_index: number;
  supplier_id: string | null;
  supplier_type_id: string | null;
  supplier_type_id_original: string | null;
  article_type_id: string | null;
  assignment_status: string | null;
}

interface BudgetRecognitionSectionProps {
  recognitionMethod: RecognitionMethod | null;
  milestones: MilestoneData[];
  milestoneMode: string | null;
  budgetStartDate: string | null;
  budgetEndDate: string | null;
  onMilestonesUpdated: () => void;
}

export function BudgetRecognitionSection({
  recognitionMethod,
  milestones,
  milestoneMode,
  budgetStartDate,
  budgetEndDate,
  onMilestonesUpdated,
}: BudgetRecognitionSectionProps) {
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);

  if (!recognitionMethod) return null;

  const isMilestoneMethod = recognitionMethod.trigger_type === 'milestone' || recognitionMethod.code === 'milestone';
  const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);

  const dialogMilestones: Milestone[] = sortedMilestones.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    targetDate: new Date(m.target_date),
    completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
    completionPercentage: m.completion_percentage,
    isCompleted: m.is_completed,
    orderIndex: m.order_index,
    supplierId: m.supplier_id,
    supplierTypeId: m.supplier_type_id,
    supplierTypeIdOriginal: m.supplier_type_id_original,
    articleTypeId: m.article_type_id,
    assignmentStatus: (m.assignment_status as 'pending' | 'assigned' | 'confirmed') || 'pending',
  }));

  const completedCount = milestones.filter((m) => m.is_completed).length;
  const avgProgress = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.completion_percentage, 0) / milestones.length)
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Méthode de reconnaissance
            </CardTitle>
            {isMilestoneMethod && milestones.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMilestoneDialogOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier les jalons
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {recognitionMethod.name_expense}
            </Badge>
            <span className="text-sm text-muted-foreground">{recognitionMethod.description}</span>
          </div>

          {isMilestoneMethod && milestones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Avancement global : {completedCount}/{milestones.length} jalons complétés
                </span>
                <span className="font-medium">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="h-2" />

              <div className="space-y-2 mt-3">
                {sortedMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      {milestone.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{milestone.title}</p>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(milestone.target_date).toLocaleDateString('fr-FR')}</span>
                      <Badge
                        variant={milestone.is_completed ? 'default' : 'outline'}
                        className="text-[10px]"
                      >
                        {milestone.completion_percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMilestoneMethod && milestones.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
              Aucun jalon défini pour ce budget.
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsMilestoneDialogOpen(true)}
                className="ml-1"
              >
                Ajouter des jalons
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <MilestoneTimelineDialog
        open={isMilestoneDialogOpen}
        onOpenChange={setIsMilestoneDialogOpen}
        milestones={dialogMilestones}
        onMilestonesChange={() => {
          onMilestonesUpdated();
        }}
        projectStartDate={budgetStartDate ? new Date(budgetStartDate) : undefined}
        projectEndDate={budgetEndDate ? new Date(budgetEndDate) : undefined}
        milestoneMode={(milestoneMode as MilestoneMode) || 'global'}
      />
    </>
  );
}
