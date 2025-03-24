import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Copy, Download, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import BudgetPurchaseOrdersDialog from '@/components/BudgetPurchaseOrdersDialog';

type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

interface Budget {
  id: string;
  code: string;
  name: string;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  type: 'Project' | 'G&A';
  poCount: number;
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  budgetId: string;
  vendor: string;
  currency: BudgetCurrency;
  amount: number;
  invoicedAmount: number;
  invoiceDate: Date | null;
  createdAt: Date;
}

const Budgets = () => {
  const { toast } = useToast();

  // Mock budget list
  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      code: 'PRJ-2023-001',
      name: 'Project Alpha Budget',
      currency: 'USD',
      initialAmount: 100000,
      remainingAmount: 45000,
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
      type: 'Project',
      poCount: 5,
      createdAt: new Date(),
    },
  ]);

  // Mock purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '101',
      poNumber: 'PO-2023-001',
      budgetId: '1',
      vendor: 'Dell Technologies',
      currency: 'USD',
      amount: 15000,
      invoicedAmount: 15000,
      invoiceDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: '102',
      poNumber: 'PO-2023-002',
      budgetId: '1',
      vendor: 'Amazon Business',
      currency: 'USD',
      amount: 20000,
      invoicedAmount: 5000,
      invoiceDate: null,
      createdAt: new Date(),
    },
    {
      id: '103',
      poNumber: 'PO-2023-003',
      budgetId: '2',
      vendor: 'Software Inc.',
      currency: 'EUR',
      amount: 10000,
      invoicedAmount: 10000,
      invoiceDate: new Date(),
      createdAt: new Date(),
    },
  ]);
  
  // Add state for purchase orders dialog
  const [selectedBudgetPOs, setSelectedBudgetPOs] = useState<PurchaseOrder[]>([]);
  const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Modify table row click handler to open dialog
  const handleBudgetRowClick = (budget: Budget) => {
    // Fetch purchase orders for this budget
    const relatedPOs = purchaseOrders.filter(po => po.budgetId === budget.id);
    
    setSelectedBudget(budget);
    setSelectedBudgetPOs(relatedPOs);
    setIsPoDialogOpen(true);
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
                      {budget.remainingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{budget.currency}</TableCell>
                    <TableCell className="text-center">{budget.poCount}</TableCell>
                    <TableCell className="text-right">
                      {budget.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
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

      {/* Add dialog for purchase orders */}
      {selectedBudget && (
        <BudgetPurchaseOrdersDialog 
          isOpen={isPoDialogOpen}
          onOpenChange={setIsPoDialogOpen}
          purchaseOrders={selectedBudgetPOs}
          budget={selectedBudget}
        />
      )}
    </>
  );
};

export default Budgets;
