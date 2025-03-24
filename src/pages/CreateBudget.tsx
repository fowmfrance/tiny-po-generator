
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BudgetCurrency, BudgetRecognitionType } from '@/services/budgetService';

interface FormValues {
  code: string;
  name: string;
  type: 'Project' | 'G&A';
  currency: BudgetCurrency;
  initialAmount: number;
  startDate: string;
  endDate: string;
  recognitionType: BudgetRecognitionType;
  completionPercentage?: number;
}

const CreateBudget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recognitionType, setRecognitionType] = useState<BudgetRecognitionType>('linear');

  const form = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      type: 'Project',
      currency: 'USD',
      initialAmount: 0,
      startDate: '',
      endDate: '',
      recognitionType: 'linear',
      completionPercentage: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    // In a real app, this would save to the backend
    console.log('Form data:', data);
    
    toast({
      title: "Budget Created",
      description: "The budget has been created successfully.",
    });
    
    navigate('/budgets');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/budgets')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Budget</h1>
          <p className="text-muted-foreground">Set up a new budget for your projects or expenses</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for this budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PRJ-2023-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique identifier for this budget
                      </FormDescription>
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
                        <Input placeholder="e.g., Project Alpha Budget" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a budget type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Project">Project</SelectItem>
                          <SelectItem value="G&A">G&A</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of expenses this budget covers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>
                  Set the financial parameters for this budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>
                        The starting amount for this budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="date" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="date" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Cost Recognition</CardTitle>
                <CardDescription>
                  Define how costs will be recognized for accounting purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="recognitionType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Recognition Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value: BudgetRecognitionType) => {
                            field.onChange(value);
                            setRecognitionType(value);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="linear" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Linear recognition (based on elapsed time)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="completion" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Service completion based recognition
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Linear: Costs are recognized evenly over the budget timeframe.
                        <br />
                        Completion: Costs are recognized based on service completion percentage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recognitionType === 'completion' && (
                  <FormField
                    control={form.control}
                    name="completionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Completion Percentage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormDescription>
                          The current percentage of service completion (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">How Cost Recognition Works</h4>
                  <p className="text-sm text-blue-700">
                    <strong>Linear Recognition:</strong> Costs are spread evenly over the budget period. For example, if your budget spans 10 months and you've completed 5 months, 50% of the budget is considered recognized.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Completion Based:</strong> Costs are recognized based on the completion percentage you specify. You'll need to manually update this percentage as the project progresses.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/budgets')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-po-blue hover:bg-blue-600"
            >
              Create Budget
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateBudget;
