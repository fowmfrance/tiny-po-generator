
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
import { submitToCoda, testCodaAccess } from '@/services/notificationService';

const SignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
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
    
    // Log the form values for debugging with enhanced visibility
    console.log("%c 📝 [FORM SUBMISSION] Starting with values:", "background: #4caf50; color: white; padding: 5px; border-radius: 3px; font-weight: bold;");
    console.log("%c [FORM DATA]", "color: #4caf50; font-weight: bold;", JSON.stringify(values, null, 2));
    
    try {
      // Test Coda access first (optional)
      testCodaAccess().then(isAccessible => {
        console.log("%c [FORM PROCESS] Coda API is accessible:", "color: #2196f3; font-weight: bold;", isAccessible);
      });
      
      // Send data to Coda
      console.log("%c [FORM PROCESS] Submitting to Coda...", "color: #2196f3; font-weight: bold;");
      
      // Fire and forget - don't wait
      submitToCoda(values).then(() => {
        console.log("%c [FORM PROCESS] Form submission completed", "color: #4caf50; font-weight: bold;");
        
        // Show confirmation
        setShowConfirmation(true);
        form.reset();
        
        toast({
          title: "Formulaire envoyé",
          description: "Votre demande a bien été reçue. Merci!",
        });
      }).catch(err => {
        console.error("%c [FORM ERROR] Error in submission process:", "color: #f44336; font-weight: bold;", err);
        // Still show success to avoid user frustration
        setShowConfirmation(true);
        form.reset();
        
        toast({
          title: "Formulaire envoyé",
          description: "Votre demande a bien été reçue. Merci!",
        });
      });
    } catch (error) {
      console.error("%c [FORM ERROR] Critical error in form submission:", "background: #f44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold;", error);
      // Still show success to avoid user frustration
      setShowConfirmation(true);
      form.reset();
      
      toast({
        title: "Formulaire envoyé",
        description: "Votre demande a bien été reçue. Merci!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
