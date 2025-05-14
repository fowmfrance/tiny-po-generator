
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Loader2 } from 'lucide-react';

const signUpSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit faire au moins 2 caractères" }),
  lastName: z.string().min(2, { message: "Le nom doit faire au moins 2 caractères" }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
  company: z.string().min(1, { message: "Veuillez entrer le nom de votre société" }),
  jobTitle: z.string().min(1, { message: "Veuillez entrer votre fonction" }),
  revenue: z.string().min(1, { message: "Veuillez sélectionner votre chiffre d'affaires" }),
  suppliersCount: z.string().min(1, { message: "Veuillez sélectionner le nombre de fournisseurs" }),
  currentTool: z.string().min(1, { message: "Veuillez sélectionner votre outil actuel" }),
  consent: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions"
  })
});

type SignUpValues = z.infer<typeof signUpSchema>;

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
      // Send form data via email
      const emailSubject = `Nouvelle inscription liste d'attente: ${values.firstName} ${values.lastName} de ${values.company}`;
      
      // Format the body as JSON
      const emailBody = JSON.stringify(values, null, 2);
      
      // Create a mailto link with the form data
      const mailtoLink = `mailto:hello@sapajoo.fr?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open the user's email client with the pre-filled email
      window.open(mailtoLink, '_blank');
      
      // Show confirmation
      setShowConfirmation(true);
      form.reset();
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Prénom" 
                      {...field} 
                      className="h-12 rounded-md border-gray-300 bg-white focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Nom" 
                      {...field} 
                      className="h-12 rounded-md border-gray-300 bg-white focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Adresse email" 
                    type="email"
                    {...field} 
                    className="h-12 rounded-md border-gray-300 bg-white focus:border-primary"
                  />
                </FormControl>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Société" 
                      {...field} 
                      className="h-12 rounded-md border-gray-300 bg-white focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Fonction" 
                      {...field} 
                      className="h-12 rounded-md border-gray-300 bg-white focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-md border-gray-300 bg-white focus:border-primary">
                      <SelectValue placeholder="Chiffre d'affaires" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="moins de 500k€">Moins de 500k€</SelectItem>
                    <SelectItem value="entre 500k€ et 1m€">Entre 500k€ et 1m€</SelectItem>
                    <SelectItem value="entre 1m€ et 10m€">Entre 1m€ et 10m€</SelectItem>
                    <SelectItem value="plus de 10m€">Plus de 10m€</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="suppliersCount"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-md border-gray-300 bg-white focus:border-primary">
                      <SelectValue placeholder="Nombre de fournisseurs différents sollicités chaque mois" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="moins de 10">Moins de 10</SelectItem>
                    <SelectItem value="entre 10 et 25">Entre 10 et 25</SelectItem>
                    <SelectItem value="entre 25 et 50">Entre 25 et 50</SelectItem>
                    <SelectItem value="plus de 50">Plus de 50</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currentTool"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-md border-gray-300 bg-white focus:border-primary">
                      <SelectValue placeholder="Avez-vous actuellement un outil (ERP)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pas d'ERP / Excel">Pas d'ERP / Excel</SelectItem>
                    <SelectItem value="Sage">Sage</SelectItem>
                    <SelectItem value="EBP">EBP</SelectItem>
                    <SelectItem value="Axonaut">Axonaut</SelectItem>
                    <SelectItem value="Odoo">Odoo</SelectItem>
                    <SelectItem value="Cegid">Cegid</SelectItem>
                    <SelectItem value="Système sur-mesure">Système sur-mesure</SelectItem>
                    <SelectItem value="Dolibarr">Dolibarr</SelectItem>
                    <SelectItem value="Evoliz">Evoliz</SelectItem>
                    <SelectItem value="Hello Harel">Hello Harel</SelectItem>
                    <SelectItem value="Pennylane">Pennylane</SelectItem>
                    <SelectItem value="Karlia">Karlia</SelectItem>
                    <SelectItem value="Super G">Super G</SelectItem>
                    <SelectItem value="SAP">SAP</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <p className="text-xs text-gray-500">
                    En cochant cette case, je reconnais avoir pris connaissance de la politique de confidentialité des données et accepte d'être recontacté(e) par l'équipe Sapajoo
                  </p>
                  <FormMessage className="text-xs mt-1" />
                </div>
              </FormItem>
            )}
          />
          
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
      
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Confirmation</DialogTitle>
            <DialogDescription>
              Nous avons bien reçu votre demande et vous informerons quand vous pourrez beta tester notre produits.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowConfirmation(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignupForm;
