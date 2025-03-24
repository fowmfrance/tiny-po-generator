
import React, { useState } from 'react';
import { Plus, Filter, Search, ArrowUpDown, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Define types for our budget data
type BudgetType = 'Project' | 'G&A';
type BudgetCurrency = 'EUR' | 'USD' | 'GBP';

interface Budget {
  id: string;
  code: string;
  name: string;
  type: BudgetType;
  currency: BudgetCurrency;
  initialAmount: number;
  remainingAmount: number;
  poCount: number;
  createdAt: Date;
}

const formSchema = z.object({
  type: z.enum(['Project', 'G&A']),
  name: z.string().min(2, {
    message: 'Budget name must be at least 2 characters.',
  }),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  initialAmount: z.number().positive({
    message: 'Amount must be a positive number.',
  }),
  code: z.string().optional(),
});

// Mock data for demonstration
const mockBudgets: Budget[] = [
  {
    id: '1',
    code: 'PRJ-001',
    name: 'Office Renovation',
    type: 'Project',
    currency: 'EUR',
    initialAmount: 50000,
    remainingAmount: 32450,
    poCount: 5,
    createdAt: new Date('2023-07-15'),
  },
  {
    id: '2',
    code: 'GA-2023-Q3',
    name: 'Q3 General & Administrative',
    type: 'G&A',
    currency: 'EUR',
    initialAmount: 25000,
    remainingAmount: 18200,
    poCount: 3,
    createdAt: new Date('2023-07-01'),
  },
  {
    id: '3',
    code: 'PRJ-002',
    name: 'IT Infrastructure',
    type: 'Project',
    currency: 'USD',
    initialAmount: 35000,
    remainingAmount: 10800,
    poCount: 8,
    createdAt: new Date('2023-06-10'),
  },
];

const Budgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'Project',
      name: '',
      currency: 'EUR',
      initialAmount: 0,
      code: '',
    },
  });

  // Filter budgets based on search term and type filter
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch =
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || budget.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Total of all budgets
  const totalInitialAmount = filteredBudgets.reduce(
    (sum, budget) => sum + budget.initialAmount,
    0
  );
  
  const totalRemainingAmount = filteredBudgets.reduce(
    (sum, budget) => sum + budget.remainingAmount,
    0
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Create a new budget
    const newBudget: Budget = {
      id: (budgets.length + 1).toString(),
      code: values.code || `${values.type === 'Project' ? 'PRJ' : 'GA'}-${Date.now().toString().slice(-6)}`,
      name: values.name,
      type: values.type,
      currency: values.currency,
      initialAmount: values.initialAmount,
      remainingAmount: values.initialAmount, // Initially, remaining amount equals initial amount
      poCount: 0,
      createdAt: new Date(),
    };
    
    setBudgets([...budgets, newBudget]);
    setDialogOpen(false);
    form.reset();
    
    toast.success('Budget created successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set up a new budget for your projects or general administrative expenses.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Budget Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Project" id="project" />
                              <Label htmlFor="project">Project</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="G&A" id="g-and-a" />
                              <Label htmlFor="g-and-a">G&A</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter budget name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="initialAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter external reference code" {...field} />
                        </FormControl>
                        <FormDescription>
                          If you don't provide a code, the system will generate one automatically.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Budget</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Budgets
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBudgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Budget Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalInitialAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRemainingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalRemainingAmount / totalInitialAmount) * 100).toFixed(1)}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="G&A">G&A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budgets table */}
      {filteredBudgets.length > 0 ? (
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Currency</TableHead>
                <TableHead className="text-right">Initial Amount</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-center">PO Count</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget) => (
                <TableRow key={budget.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{budget.code}</TableCell>
                  <TableCell>{budget.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      budget.type === 'Project'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-green-50 text-green-800'
                    }`}>
                      {budget.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{budget.currency}</TableCell>
                  <TableCell className="text-right">
                    {budget.currency === 'EUR' ? '€' : budget.currency === 'USD' ? '$' : '£'}
                    {budget.initialAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`${
                      budget.remainingAmount / budget.initialAmount < 0.2
                        ? 'text-red-600'
                        : budget.remainingAmount / budget.initialAmount < 0.5
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}>
                      {budget.currency === 'EUR' ? '€' : budget.currency === 'USD' ? '$' : '£'}
                      {budget.remainingAmount.toLocaleString()} 
                      ({((budget.remainingAmount / budget.initialAmount) * 100).toFixed(0)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{budget.poCount}</TableCell>
                  <TableCell className="text-right">
                    {budget.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No budgets found.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Budget
          </Button>
        </div>
      )}
    </div>
  );
};

export default Budgets;
