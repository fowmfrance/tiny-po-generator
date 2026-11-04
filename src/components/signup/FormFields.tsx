
import React from 'react';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import { SignUpValues } from '@/schemas/signupSchema';

interface FormFieldsProps {
  form: UseFormReturn<SignUpValues>;
}

export const NameFields = ({ form }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="firstName"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input 
              placeholder="Prénom"
              aria-label="Prénom" 
              {...field} 
              className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand"
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
              aria-label="Nom" 
              {...field} 
              className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand"
            />
          </FormControl>
          <FormMessage className="text-xs mt-1" />
        </FormItem>
      )}
    />
  </div>
);

export const EmailField = ({ form }: FormFieldsProps) => (
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormControl>
          <Input 
            placeholder="Adresse e-mail professionnelle"
              aria-label="Adresse e-mail professionnelle" 
            type="email"
            {...field} 
            className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand"
          />
        </FormControl>
        <FormMessage className="text-xs mt-1" />
      </FormItem>
    )}
  />
);

export const CompanyFields = ({ form }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="company"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input 
              placeholder="Société"
              aria-label="Société" 
              {...field} 
              className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand"
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
              aria-label="Fonction" 
              {...field} 
              className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand"
            />
          </FormControl>
          <FormMessage className="text-xs mt-1" />
        </FormItem>
      )}
    />
  </div>
);

export const RevenueField = ({ form }: FormFieldsProps) => (
  <FormField
    control={form.control}
    name="revenue"
    render={({ field }) => (
      <FormItem>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand" aria-label="Chiffre d'affaires annuel">
              <SelectValue placeholder="Chiffre d'affaires annuel" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="moins de 500k€">Moins de 500&nbsp;k€</SelectItem>
            <SelectItem value="entre 500k€ et 1m€">500&nbsp;k€ à 1&nbsp;M€</SelectItem>
            <SelectItem value="entre 1m€ et 10m€">1 à 10&nbsp;M€</SelectItem>
            <SelectItem value="plus de 10m€">Plus de 10&nbsp;M€</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage className="text-xs mt-1" />
      </FormItem>
    )}
  />
);

export const SuppliersCountField = ({ form }: FormFieldsProps) => (
  <FormField
    control={form.control}
    name="suppliersCount"
    render={({ field }) => (
      <FormItem>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand" aria-label="Fournisseurs différents sollicités chaque mois">
              <SelectValue placeholder="Fournisseurs différents sollicités chaque mois" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="moins de 10">Moins de 10</SelectItem>
            <SelectItem value="entre 10 et 25">10 à 25</SelectItem>
            <SelectItem value="entre 25 et 50">25 à 50</SelectItem>
            <SelectItem value="plus de 50">Plus de 50</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage className="text-xs mt-1" />
      </FormItem>
    )}
  />
);

export const CurrentToolField = ({ form }: FormFieldsProps) => (
  <FormField
    control={form.control}
    name="currentTool"
    render={({ field }) => (
      <FormItem>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger className="h-12 rounded-[10px] border-border bg-card text-foreground focus:border-brand" aria-label="Votre outil actuel (ERP ou comptabilité)">
              <SelectValue placeholder="Votre outil actuel (ERP ou comptabilité)" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="pas d'ERP / Excel">Pas d'ERP / Excel</SelectItem>
            <SelectItem value="Sage">Sage</SelectItem>
            <SelectItem value="EBP">EBP</SelectItem>
            <SelectItem value="Axonaut">Axonaut</SelectItem>
            <SelectItem value="Odoo">Odoo</SelectItem>
            <SelectItem value="Cegid">Cegid</SelectItem>
            <SelectItem value="Système sur-mesure">Système sur mesure</SelectItem>
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
);

export const ConsentField = ({ form }: FormFieldsProps) => (
  <FormField
    control={form.control}
    name="consent"
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox 
            className="border-background/70 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <p className="text-xs text-background/70">
            J'ai lu la politique de confidentialité et j'accepte d'être recontacté(e) par l'équipe Sapajoo.
          </p>
          <FormMessage className="text-xs mt-1" />
        </div>
      </FormItem>
    )}
  />
);
