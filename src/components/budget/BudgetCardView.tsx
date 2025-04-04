
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Edit, MoreVertical, Users, CalendarRange } from 'lucide-react';
import { BudgetCurrency, formatCurrency } from '@/services/budgetService';
import { Budget } from '@/models/Budget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from 'react-router-dom';

interface BudgetCardViewProps {
  budgets: Budget[];
}

const BudgetCardView: React.FC<BudgetCardViewProps> = ({ budgets }) => {
  const navigate = useNavigate();

  // Handle budget card click to navigate to details page
  const handleBudgetClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((budget) => (
        <Card 
          key={budget.id} 
          className="cursor-pointer hover:shadow-md transition-shadow flex flex-col"
          onClick={() => handleBudgetClick(budget)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-1">{budget.type}</Badge>
                <CardTitle className="text-lg">{budget.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/budgets/${budget.id}/edit`); }}>
                    <Edit className="mr-2 h-4 w-4" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                    <Users className="mr-2 h-4 w-4" /> Ajouter des participants
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-sm text-gray-500">Initial</p>
                <p className="font-medium">{formatCurrency(budget.currency, budget.initialAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Disponible</p>
                <p className="font-medium">{formatCurrency(budget.currency, budget.availableAmount)}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Utilisation</span>
                <span>{Math.round((1 - budget.availableAmount / budget.initialAmount) * 100)}%</span>
              </div>
              <Progress value={(1 - budget.availableAmount / budget.initialAmount) * 100} className="h-2" />
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <CalendarRange className="h-3.5 w-3.5 mr-1" />
              {budget.startDate && budget.endDate ? (
                <span>
                  {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
                </span>
              ) : (
                <span>Pas de dates définies</span>
              )}
            </div>
          </CardContent>
          <CardFooter className="mt-auto pt-0" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50 w-full"
              disabled={budget.availableAmount <= 0}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Envoyer BC
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default BudgetCardView;

