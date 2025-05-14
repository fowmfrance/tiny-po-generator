
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Form } from './ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { signUpSchema, SignUpValues } from '@/schemas/signupSchema';
import ConfirmationDialog from './signup/ConfirmationDialog';
import {
  NameFields,
  EmailField,
  CompanyFields,
  RevenueField,
  SuppliersCountField,
  CurrentToolField,
  ConsentField
} from './signup/FormFields';
import { submitToCoda } from '@/services/notificationService';
import { Alert, AlertDescription } from './ui/alert';

const SignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      jobTitle: '',
      revenue: '',
      suppliersCount: '',
      currentTool: '',
      consent: false
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    // Log the form values to help with debugging
    console.log("Form submission started with values:", values);
    
    try {
      // Send data to Coda with the specific column mapping
      const success = await submitToCoda(values);
      
      if (success) {
        // Show confirmation
        setShowConfirmation(true);
        form.reset();
        
        toast({
          title: "Formulaire envoyé",
          description: "Votre demande a bien été reçue. Merci!",
        });
      } else {
        throw new Error("La requête a échoué");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmissionError("Une erreur est survenue lors de l'envoi des données. Veuillez réessayer.");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi des données. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {submissionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}
          
          <NameFields form={form} />
          <EmailField form={form} />
          <CompanyFields form={form} />
          <RevenueField form={form} />
          <SuppliersCountField form={form} />
          <CurrentToolField form={form} />
          <ConsentField form={form} />
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 rounded-md font-serif text-lg bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "S'inscrire sur la liste d'attente"
            )}
          </Button>
        </form>
      </Form>
      
      <ConfirmationDialog 
        open={showConfirmation} 
        onOpenChange={setShowConfirmation}
      />
    </>
  );
};

export default SignupForm;
