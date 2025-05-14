
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { submitToCoda } from '@/services/notificationService';
import { Alert, AlertDescription } from './ui/alert';

const waitingListSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
});

type WaitingListValues = z.infer<typeof waitingListSchema>;

const WaitingListForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const form = useForm<WaitingListValues>({
    resolver: zodResolver(waitingListSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: WaitingListValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      console.log('[WAITING_LIST] Email submitted:', values.email);
      
      // Format the data in a way compatible with submitToCoda
      const formattedValues = {
        firstName: '',
        lastName: '',
        email: values.email,
        company: '',
        jobTitle: '',
        revenue: '',
        suppliersCount: '',
        currentTool: '',
        consent: true
      };
      
      console.log('[WAITING_LIST] Calling submitToCoda with formatted values:', JSON.stringify(formattedValues));
      const success = await submitToCoda(formattedValues);
      console.log('[WAITING_LIST] submitToCoda result:', success);
      
      if (success) {
        toast({
          title: "Inscription réussie !",
          description: "Vous êtes maintenant sur notre liste d'attente. Nous vous contacterons bientôt.",
        });
        
        form.reset();
      } else {
        throw new Error("La requête a échoué");
      }
    } catch (error) {
      console.error("[WAITING_LIST] Error submitting email:", error);
      setSubmissionError("Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        {submissionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-3 w-full">
                <FormControl>
                  <Input 
                    placeholder="Votre adresse email" 
                    {...field} 
                    className="flex-1 h-12 rounded-lg bg-gray-50 border-gray-200 focus:bg-white focus:border-primary"
                  />
                </FormControl>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 h-12 font-medium rounded-lg transition-all duration-300 hover:shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center">
                      S'inscrire
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
              <FormMessage className="text-xs mt-1" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default WaitingListForm;
