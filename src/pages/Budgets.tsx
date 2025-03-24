
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
  Download 
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

type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  receivedAmount: number; // Added receivedAmount field
  type: 'Project' | 'G&A';
  poCount: number;
  createdAt: Date;
}

const Budgets = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock budget list
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      code: 'PRJ-2023-001',
      name: 'Project Alpha Budget',
      currency: 'USD',
      initialAmount: 100000,
      remainingAmount: 45000,
      receivedAmount: 55000, // Initial amount - remaining amount
      type: 'Project',
      poCount: 12,
      createdAt: new Date(),
    },
    {
      id: '2',
      code: 'GA-2023-002',
      name: 'G&A Expenses Q3',
      currency: 'EUR',
      initialAmount: 50000,
      remainingAmount: 23000,
      receivedAmount: 27000, // Initial amount - remaining amount
      type: 'G&A',
      poCount: 8,
      createdAt: new Date(),
    },
    {
      id: '3',
      code: 'PRJ-2023-003',
      name: 'Project Beta Budget',
      currency: 'GBP',
      initialAmount: 75000,
      remainingAmount: 60000,
      receivedAmount: 15000, // Initial amount - remaining amount
      type: 'Project',
      poCount: 5,
      createdAt: new Date(),
    },
  ]);

  // Handle budget row click to navigate to details page
  const handleBudgetRowClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-gray-500">Manage your budgets and track expenses.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Budget List</CardTitle>
              <CardDescription>
                Here you can view and manage all your budgets.
              </CardDescription>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Initial Amount</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-center">Currency</TableHead>
                  <TableHead className="text-center">PO Count</TableHead>
                  <TableHead className="text-right">Created At</TableHead>
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
                      {budget.initialAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.receivedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.remainingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{budget.currency}</TableCell>
                    <TableCell className="text-center">{budget.poCount}</TableCell>
                    <TableCell className="text-right">
                      {budget.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Copy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" /> Download
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
