import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Flag, 
  RefreshCw, 
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MilestoneConfirmationReport } from '@/components/budget/MilestoneConfirmationReport';

interface BudgetMilestone {
  id: string;
  budget_id: string;
  title: string;
  description: string | null;
  target_date: string;
  completed_date: string | null;
  completion_percentage: number;
  is_completed: boolean;
  order_index: number;
}

interface Budget {
  id: string;
  code: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget_milestones: BudgetMilestone[];
}

const MilestoneReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch budgets with milestones
  const { data: budgets = [], isLoading, refetch } = useQuery({
    queryKey: ['budgets-with-milestones'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .select(`
          id,
          code,
          name,
          start_date,
          end_date,
          status,
          budget_milestones (
            id,
            budget_id,
            title,
            description,
            target_date,
            completed_date,
            completion_percentage,
            is_completed,
            order_index
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Budget[]) || [];
    },
  });

  // Mutation pour confirmer un milestone
  const confirmMutation = useMutation({
    mutationFn: async ({ 
      milestoneId, 
      isOnTime, 
      newDate, 
      notes 
    }: { 
      milestoneId: string; 
      isOnTime: boolean; 
      newDate?: Date; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isOnTime) {
        // Marquer comme complété
        const { error: updateError } = await supabase
          .from('budget_milestones')
          .update({
            is_completed: true,
            completed_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', milestoneId);

        if (updateError) throw updateError;

        // Créer une confirmation
        const { error: confirmError } = await supabase
          .from('milestone_confirmations')
          .insert({
            milestone_id: milestoneId,
            confirmed_by: user.id,
            is_on_time: true,
            notes: notes || null,
          });

        if (confirmError) throw confirmError;
      } else {
        // Reporter le milestone
        const { error: updateError } = await supabase
          .from('budget_milestones')
          .update({
            target_date: newDate?.toISOString().split('T')[0],
          })
          .eq('id', milestoneId);

        if (updateError) throw updateError;

        // Créer une confirmation de report
        const { error: confirmError } = await supabase
          .from('milestone_confirmations')
          .insert({
            milestone_id: milestoneId,
            confirmed_by: user.id,
            is_on_time: false,
            new_target_date: newDate?.toISOString().split('T')[0],
            notes: notes || null,
          });

        if (confirmError) throw confirmError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets-with-milestones'] });
      toast({
        title: "Jalon mis à jour",
        description: "Le statut du jalon a été enregistré avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le jalon.",
        variant: "destructive",
      });
      console.error('Error updating milestone:', error);
    },
  });

  // Transformer les données pour le composant MilestoneConfirmationReport
  const projectsData = useMemo(() => {
    return budgets
      .filter(b => b.budget_milestones && b.budget_milestones.length > 0)
      .filter(b => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') {
          return b.budget_milestones.some(m => !m.is_completed);
        }
        if (statusFilter === 'completed') {
          return b.budget_milestones.every(m => m.is_completed);
        }
        return true;
      })
      .map(budget => ({
        id: budget.id,
        code: budget.code,
        name: budget.name,
        startDate: budget.start_date ? parseISO(budget.start_date) : new Date(),
        endDate: budget.end_date ? parseISO(budget.end_date) : new Date(),
        milestones: budget.budget_milestones.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description || undefined,
          targetDate: parseISO(m.target_date),
          completedDate: m.completed_date ? parseISO(m.completed_date) : undefined,
          completionPercentage: Number(m.completion_percentage),
          isCompleted: m.is_completed,
          orderIndex: m.order_index,
        })),
      }));
  }, [budgets, statusFilter]);

  // Statistiques globales
  const stats = useMemo(() => {
    const allMilestones = budgets.flatMap(b => b.budget_milestones || []);
    const total = allMilestones.length;
    const completed = allMilestones.filter(m => m.is_completed).length;
    const overdue = allMilestones.filter(m => {
      if (m.is_completed) return false;
      const targetDate = parseISO(m.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate < today;
    }).length;
    const pending = total - completed;

    return { total, completed, pending, overdue };
  }, [budgets]);

  const handleConfirmMilestone = (
    projectId: string, 
    milestoneId: string, 
    isOnTime: boolean, 
    newDate?: Date, 
    notes?: string
  ) => {
    confirmMutation.mutate({ milestoneId, isOnTime, newDate, notes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" />
            Suivi des jalons
          </h1>
          <p className="text-muted-foreground">
            Confirmez l'avancement de vos projets et gérez les reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              <SelectItem value="pending">En cours</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Flag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total jalons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Complétés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progression globale */}
      {stats.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progression globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.completed} jalons complétés sur {stats.total}
                </span>
                <span className="font-medium">
                  {((stats.completed / stats.total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rapport de confirmation */}
      {projectsData.length > 0 ? (
        <MilestoneConfirmationReport
          projects={projectsData}
          onConfirmMilestone={handleConfirmMilestone}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">Aucun projet avec jalons</h3>
            <p className="text-muted-foreground mt-2">
              Créez un budget avec la méthode "Milestone" pour définir des jalons à suivre.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/budgets/create'}>
              <Flag className="h-4 w-4 mr-2" />
              Créer un budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MilestoneReport;
