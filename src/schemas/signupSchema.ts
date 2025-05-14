
import { z } from 'zod';

export const signUpSchema = z.object({
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

export type SignUpValues = z.infer<typeof signUpSchema>;
