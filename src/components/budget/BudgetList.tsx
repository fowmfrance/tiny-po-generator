
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Download,
  CalendarRange
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { BudgetCurrency, BudgetRecognitionType, formatCurrency } from '@/services/budgetService';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  receivedAmount: number;
  type: 'Project' | 'G&A';
  poCount: number;
  createdAt: Date;
  startDate: Date | null;
  endDate: Date | null;
  recognitionType: BudgetRecognitionType;
  completionPercentage?: number;
}

interface BudgetListProps {
  budgets: Budget[];
}

const BudgetList: React.FC<BudgetListProps> = ({ budgets }) => {
  const navigate = useNavigate();

  // Handle budget row click to navigate to details page
  const handleBudgetRowClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="text-center">Type</TableHead>
          <TableHead className="text-right">Montant Initial</TableHead>
          <TableHead className="text-right">Reçu</TableHead>
          <TableHead className="text-right">Restant</TableHead>
          <TableHead className="text-center">Devise</TableHead>
          <TableHead className="text-center">Reconnaissance</TableHead>
          <TableHead className="text-center">Période</TableHead>
          <TableHead className="text-center">BCs</TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgets.map((budget) => (
          <TableRow 
            key={budget.id} 
            onClick={() => handleBudgetRowClick(budget)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <TableCell className="font-medium">{budget.code}</TableCell>
            <TableCell>{budget.name}</TableCell>
            <TableCell className="text-center">
              <Badge variant="secondary">{budget.type}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(budget.currency, budget.initialAmount)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(budget.currency, budget.receivedAmount)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(budget.currency, budget.remainingAmount)}
            </TableCell>
            <TableCell className="text-center">{budget.currency}</TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" className="capitalize">
                {budget.recognitionType === 'linear' ? 'Linéaire' : 'Complété'}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              {budget.startDate && budget.endDate ? (
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <CalendarRange className="h-3 w-3 mr-1" />
                  <span>
                    {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-500">Pas de dates définies</span>
              )}
            </TableCell>
            <TableCell className="text-center">{budget.poCount}</TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Ouvrir menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" /> Dupliquer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" /> Télécharger
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BudgetList;
