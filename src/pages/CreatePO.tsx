
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  AlertCircle,
  CircleCheck,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validateBudgetActive, 
  BudgetCurrency, 
  BudgetRecognitionType, 
  calculateRecognizedAmount 
} from '@/services/budgetService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BudgetNavState {
  budgetId?: string;
  budgetName?: string;
  budgetCode?: string;
  budgetStartDate?: Date | null;
  budgetEndDate?: Date | null;
  budgetCurrency?: BudgetCurrency;
  budgetRecognitionType?: BudgetRecognitionType;
  budgetCompletionPercentage?: number;
}

const CreatePO = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const budgetInfo: BudgetNavState = location.state || {};
  const { 
    budgetId, 
    budgetName, 
    budgetCode,
    budgetStartDate,
    budgetEndDate,
    budgetCurrency,
    budgetRecognitionType,
    budgetCompletionPercentage
  } = budgetInfo;

  const [isFromBudget, setIsFromBudget] = useState<boolean>(!!budgetId);
  const [budgetStatus, setBudgetStatus] = useState<{ active: boolean; message?: string }>({ active: true });

  useEffect(() => {
    if (budgetId && (budgetStartDate || budgetEndDate)) {
      const status = validateBudgetActive(
        budgetStartDate ? new Date(budgetStartDate) : null,
        budgetEndDate ? new Date(budgetEndDate) : null
      );
      setBudgetStatus(status);
    }
  }, [budgetId, budgetStartDate, budgetEndDate]);

  const vendorList = [
    { id: '1', name: 'Apple Inc.' },
    { id: '2', name: 'Microsoft Corp' },
    { id: '3', name: 'Dell Technologies' },
    { id: '4', name: 'Amazon Business' },
    { id: '5', name: 'Samsung Electronics' },
  ];

  // Calculate recognition data if budget info is available
  const recognitionData = budgetId && budgetRecognitionType && budgetStartDate && budgetEndDate ? 
    calculateRecognizedAmount(
      100, // Using 100 as a percent value for visualization
      budgetRecognitionType,
      new Date(budgetStartDate),
      new Date(budgetEndDate),
      budgetCompletionPercentage
    ) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (budgetId && !budgetStatus.active) {
      toast({
        variant: "destructive",
        title: "Cannot create Purchase Order",
        description: budgetStatus.message,
      });
      return;
    }
    
    toast({
      title: "Purchase Order Created",
      description: "The purchase order has been created successfully.",
    });
    
    if (budgetId) {
      navigate(`/budgets/${budgetId}`);
    } else {
      navigate('/purchase-orders');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Purchase Order</h1>
          {budgetName && (
            <p className="text-muted-foreground">For budget: {budgetName}</p>
          )}
        </div>
      </div>

      {budgetId && !budgetStatus.active && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget not active</AlertTitle>
          <AlertDescription>
            {budgetStatus.message} You cannot create purchase orders for this budget.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Purchase Order Information</CardTitle>
              <CardDescription>
                Enter the details for this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poType">PO Type</Label>
                  <Select defaultValue="project">
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project Related</SelectItem>
                      <SelectItem value="ga">G&A Related</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poNumberFormat">PO Number Format</Label>
                  <Input 
                    id="poNumberFormat" 
                    placeholder="PR-{YYYY}-{000}" 
                    defaultValue={budgetCode ? `${budgetCode}-` : "PR-2023-"} 
                  />
                </div>
              </div>

              {budgetId && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-blue-700">This PO will be associated with budget: {budgetName}</p>
                      {(budgetStartDate || budgetEndDate) && (
                        <p className="text-xs text-blue-600 mt-1">
                          Budget period: {budgetStartDate ? new Date(budgetStartDate).toLocaleDateString() : 'No start date'} - {budgetEndDate ? new Date(budgetEndDate).toLocaleDateString() : 'No end date'}
                        </p>
                      )}
                    </div>
                    {budgetRecognitionType && (
                      <Badge variant="outline" className="capitalize">
                        {budgetRecognitionType} recognition
                      </Badge>
                    )}
                  </div>
                  
                  {recognitionData && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-700">Recognition Progress</span>
                        <span className="text-blue-700">{recognitionData.recognitionPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={recognitionData.recognitionPercentage} className="h-1.5" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorList.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue={budgetCurrency?.toLowerCase() || "usd"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                  <div className="relative">
                    <Input 
                      id="expectedDate" 
                      type="date"
                      className="pl-10"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Enter any additional notes or requirements"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Select the approval workflow for this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow">Workflow Template</Label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Approval</SelectItem>
                    <SelectItem value="express">Express Approval</SelectItem>
                    <SelectItem value="extended">Extended Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Approval Steps</Label>
                </div>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  <div className="text-sm text-gray-500">
                    1. Department Manager
                  </div>
                  <div className="text-sm text-gray-500">
                    2. Finance Approval
                  </div>
                  <div className="text-sm text-gray-500">
                    3. Final Approval
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>
                    Add items to this purchase order
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">
                        <Input placeholder="Item description" defaultValue="Laptop - MacBook Pro 14'" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" defaultValue="2" min="1" className="w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" defaultValue="1999.99" min="0" step="0.01" className="w-32" />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        $3,999.98
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <Input placeholder="Item description" defaultValue="Software License - Adobe CC" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" defaultValue="5" min="1" className="w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" defaultValue="599.99" min="0" step="0.01" className="w-32" />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        $2,999.95
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        $6,999.93
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => budgetId ? navigate(`/budgets/${budgetId}`) : navigate('/purchase-orders')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-po-blue hover:bg-blue-600"
            disabled={budgetId && !budgetStatus.active}
          >
            Create Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePO;
