
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import BudgetList from '@/components/budget/BudgetList';
import BudgetHeader from '@/components/budget/BudgetHeader';
import { useBudgetsData } from '@/hooks/useBudgetsData';

const Budgets = () => {
  const { toast } = useToast();
  const { budgets } = useBudgetsData();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-gray-500">Gérez vos budgets et suivez vos dépenses.</p>
        </div>

        <Card>
          <CardHeader>
            <BudgetHeader 
              title="Liste des Budgets" 
              description="Vous pouvez consulter et gérer tous vos budgets ici."
            />
          </CardHeader>
          <CardContent>
            <BudgetList budgets={budgets} />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Budgets;
