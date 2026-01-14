
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import BudgetList from '@/components/budget/BudgetList';
import BudgetHeader from '@/components/budget/BudgetHeader';
import BudgetViewToggle, { ViewType } from '@/components/budget/BudgetViewToggle';
import BudgetCardView from '@/components/budget/BudgetCardView';
import BudgetKanbanView from '@/components/budget/BudgetKanbanView';
import { useBudgetsData } from '@/hooks/useBudgetsData';
import { Loader2 } from 'lucide-react';

const Budgets = () => {
  const { toast } = useToast();
  const { budgets, isLoading, error, user } = useBudgetsData();
  const [viewType, setViewType] = useState<ViewType>('list');

  const handleViewChange = (view: ViewType) => {
    setViewType(view);
    toast({
      title: "Vue changée",
      description: `Vue des budgets mise à jour vers ${
        view === 'list' ? 'Liste' : view === 'grid' ? 'Cartes' : 'Kanban'
      }`,
    });
  };

  const renderBudgetView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Vous n’êtes pas connecté. Connectez-vous pour voir vos budgets.
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-destructive">
          Erreur lors du chargement des budgets
        </div>
      );
    }

    if (budgets.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Aucun budget trouvé. Créez votre premier budget pour commencer.
        </div>
      );
    }

    switch (viewType) {
      case 'grid':
        return <BudgetCardView budgets={budgets} />;
      case 'kanban':
        return <BudgetKanbanView budgets={budgets} />;
      case 'list':
      default:
        return <BudgetList budgets={budgets} />;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Budgets</h1>
            <p className="text-gray-500">Gérez vos budgets et suivez vos dépenses.</p>
          </div>
          <BudgetViewToggle activeView={viewType} onViewChange={handleViewChange} />
        </div>

        <Card>
          <CardHeader>
            <BudgetHeader 
              title="Liste des Budgets" 
              description="Vous pouvez consulter et gérer tous vos budgets ici."
            />
          </CardHeader>
          <CardContent>
            {renderBudgetView()}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Budgets;
