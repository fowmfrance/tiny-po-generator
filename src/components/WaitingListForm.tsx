
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { toast } from './ui/use-toast';

const waitingListSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
});

type WaitingListValues = z.infer<typeof waitingListSchema>;

const WaitingListForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<WaitingListValues>({
    resolver: zodResolver(waitingListSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: WaitingListValues) => {
    setIsSubmitting(true);
    try {
      // This is where you would integrate with your email collection service
      console.log('Email submitted:', values.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Inscription réussie !",
        description: "Vous êtes maintenant sur notre liste d'attente. Nous vous contacterons bientôt.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-2 w-full">
                <FormControl>
                  <Input 
                    placeholder="Votre adresse email" 
                    {...field} 
                    className="flex-1 h-12"
                  />
                </FormControl>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 h-12"
                >
                  {isSubmitting ? "..." : "S'inscrire"}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default WaitingListForm;
