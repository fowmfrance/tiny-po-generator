
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
);

export const EmailField = ({ form }: FormFieldsProps) => (
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
);

export const RevenueField = ({ form }: FormFieldsProps) => (
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
);

export const SuppliersCountField = ({ form }: FormFieldsProps) => (
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
);

export const CurrentToolField = ({ form }: FormFieldsProps) => (
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
);

export const ConsentField = ({ form }: FormFieldsProps) => (
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
);
