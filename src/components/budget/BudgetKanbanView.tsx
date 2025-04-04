
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Budget } from '@/models/Budget';
import { formatCurrency } from '@/services/budgetService';
import { Badge } from '@/components/ui/badge';
import { CalendarRange } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BudgetKanbanViewProps {
  budgets: Budget[];
}

const BudgetKanbanView: React.FC<BudgetKanbanViewProps> = ({ budgets }) => {
  const navigate = useNavigate();
  
  // Handle budget card click to navigate to details page
  const handleBudgetClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  // Filter budgets by status
  const highBudgets = budgets.filter(b => b.initialAmount > 50000);
  const mediumBudgets = budgets.filter(b => b.initialAmount <= 50000 && b.initialAmount > 10000);
  const smallBudgets = budgets.filter(b => b.initialAmount <= 10000);

  const renderBudgetCard = (budget: Budget) => (
    <Card 
      key={budget.id} 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleBudgetClick(budget)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-1">{budget.type}</Badge>
          <Badge 
            variant={budget.availableAmount > 0 ? "outline" : "destructive"} 
            className={budget.availableAmount > 0 ? "bg-green-50 text-green-700 border-green-200" : ""}
          >
            {budget.availableAmount > 0 ? 'Actif' : 'Épuisé'}
          </Badge>
        </div>
        <CardTitle className="text-base mt-1">{budget.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs text-gray-500">Initial</p>
            <p className="font-medium text-sm">{formatCurrency(budget.currency, budget.initialAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Disponible</p>
            <p className="font-medium text-sm">{formatCurrency(budget.currency, budget.availableAmount)}</p>
          </div>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 mt-2">
          <CalendarRange className="h-3 w-3 mr-1" />
          {budget.startDate && budget.endDate ? (
            <span>
              {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
            </span>
          ) : (
            <span>Pas de dates définies</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <div className="bg-gray-100 p-3 rounded-t-md border-b border-gray-200">
          <h3 className="font-medium">Budget élevé</h3>
          <p className="text-xs text-gray-500">Plus de 50,000 €</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-b-md min-h-[300px]">
          {highBudgets.length > 0 ? (
            highBudgets.map(renderBudgetCard)
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p>Aucun budget élevé</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <div className="bg-gray-100 p-3 rounded-t-md border-b border-gray-200">
          <h3 className="font-medium">Budget moyen</h3>
          <p className="text-xs text-gray-500">10,000 € à 50,000 €</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-b-md min-h-[300px]">
          {mediumBudgets.length > 0 ? (
            mediumBudgets.map(renderBudgetCard)
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p>Aucun budget moyen</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <div className="bg-gray-100 p-3 rounded-t-md border-b border-gray-200">
          <h3 className="font-medium">Budget faible</h3>
          <p className="text-xs text-gray-500">Moins de 10,000 €</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-b-md min-h-[300px]">
          {smallBudgets.length > 0 ? (
            smallBudgets.map(renderBudgetCard)
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p>Aucun budget faible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetKanbanView;
