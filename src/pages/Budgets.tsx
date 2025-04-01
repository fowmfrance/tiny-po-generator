
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Copy, 
  Download,
  CalendarRange
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const Budgets = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock budget list
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      code: 'PRJ-2023-001',
      name: 'Budget Projet Alpha',
      currency: 'EUR',
      initialAmount: 100000,
      remainingAmount: 45000,
      receivedAmount: 55000,
      type: 'Project',
      poCount: 12,
      createdAt: new Date(),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      recognitionType: 'linear',
    },
    {
      id: '2',
      code: 'GA-2023-002',
      name: 'Frais G&A Q3',
      currency: 'EUR',
      initialAmount: 50000,
      remainingAmount: 23000,
      receivedAmount: 27000,
      type: 'G&A',
      poCount: 8,
      createdAt: new Date(),
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-09-30'),
      recognitionType: 'completion',
      completionPercentage: 65,
    },
    {
      id: '3',
      code: 'PRJ-2023-003',
      name: 'Budget Projet Beta',
      currency: 'GBP',
      initialAmount: 75000,
      remainingAmount: 60000,
      receivedAmount: 15000,
      type: 'Project',
      poCount: 5,
      createdAt: new Date(),
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-05-31'),
      recognitionType: 'linear',
    },
  ]);

  // Handle budget row click to navigate to details page
  const handleBudgetRowClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  // Handle create budget button click
  const handleCreateBudget = () => {
    navigate('/budgets/create');
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-gray-500">Gérez vos budgets et suivez vos dépenses.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Liste des Budgets</CardTitle>
                <CardDescription>
                  Vous pouvez consulter et gérer tous vos budgets ici.
                </CardDescription>
              </div>
              <Button onClick={handleCreateBudget}>
                <Plus className="w-4 h-4 mr-2" />
                Créer Budget
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Budgets;
