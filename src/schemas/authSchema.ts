import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'email est requis" })
    .email({ message: "Format d'email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" }),
  password: z
    .string()
    .min(1, { message: "Le mot de passe est requis" })
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
    .max(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" }),
});

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'email est requis" })
    .email({ message: "Format d'email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" }),
  password: z
    .string()
    .min(1, { message: "Le mot de passe est requis" })
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
    .max(128, { message: "Le mot de passe ne peut pas dépasser 128 caractères" })
    .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
    .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une minuscule" })
    .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" }),
  fullName: z
    .string()
    .trim()
    .min(1, { message: "Le nom complet est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" }),
  company: z
    .string()
    .trim()
    .min(1, { message: "Le nom de l'entreprise est requis" })
    .max(100, { message: "Le nom de l'entreprise ne peut pas dépasser 100 caractères" }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'email est requis" })
    .email({ message: "Format d'email invalide" })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
