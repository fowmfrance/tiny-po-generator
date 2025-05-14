
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
import { sendMockNotification } from '@/services/notifications/notificationApi';

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
      // Send notification using Supersend mock implementation
      const emailSubject = `Nouvelle inscription liste d'attente: ${values.firstName} ${values.lastName} de ${values.company}`;
      
      await sendMockNotification('vendor_invited', {
        email: 'hello@sapajoo.fr',
        name: 'Sapajoo Team'
      }, {
        subject: emailSubject,
        formData: values,
        date: new Date().toISOString()
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
