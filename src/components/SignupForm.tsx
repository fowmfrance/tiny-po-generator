
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Form } from './ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from './ui/use-toast';
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

// This can be configured in your settings or environment
const WEBHOOK_URL = "https://coda.io/apis/v1/webhooks/YOUR_WEBHOOK_ID";
// For Airtable, the webhook URL would look like: https://api.airtable.com/v0/YOUR_BASE_ID/YOUR_TABLE_NAME

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
    try {
      // Prepare the data to be sent to the webhook
      const formData = {
        ...values,
        submittedAt: new Date().toISOString(),
        source: window.location.href
      };

      // Send data to Coda/Airtable webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        mode: 'no-cors' // This might be needed for cross-origin requests
      });
      
      // Show confirmation
      setShowConfirmation(true);
      form.reset();
      
      toast({
        title: "Formulaire envoyé",
        description: "Votre demande a bien été reçue. Merci!",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Form submission error:", error);
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
