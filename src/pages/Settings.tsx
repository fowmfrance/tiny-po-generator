
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { availableCurrencies, BudgetCurrency, defaultCurrency } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';
import { Euro, Wallet, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [enabledCurrencies, setEnabledCurrencies] = useState<BudgetCurrency[]>(['EUR', 'USD', 'GBP']);
  const [defaultCurrency, setDefaultCurrency] = useState<BudgetCurrency>('EUR');
  
  const handleCurrencyToggle = (currency: BudgetCurrency, isChecked: boolean) => {
    if (isChecked) {
      setEnabledCurrencies(prev => [...prev, currency]);
    } else {
      // Don't allow disabling the default currency
      if (currency === defaultCurrency) {
        toast({
          variant: "destructive",
          title: "Action non autorisée",
          description: "Vous ne pouvez pas désactiver la devise par défaut.",
        });
        return;
      }
      setEnabledCurrencies(prev => prev.filter(c => c !== currency));
    }
  };
  
  const handleSetAsDefault = (currency: BudgetCurrency) => {
    setDefaultCurrency(currency);
    
    // Make sure the currency is enabled
    if (!enabledCurrencies.includes(currency)) {
      setEnabledCurrencies(prev => [...prev, currency]);
    }
    
    toast({
      title: "Devise par défaut modifiée",
      description: `${currency} est maintenant la devise par défaut.`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-gray-500">Gérez les paramètres de votre application.</p>
      </div>
      
      <Tabs defaultValue="currencies">
        <TabsList>
          <TabsTrigger value="currencies">
            <Euro className="h-4 w-4 mr-2" />
            Devises
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="currencies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Devises</CardTitle>
              <CardDescription>
                Configurez les devises disponibles pour les bons de commande et les budgets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Devises Disponibles</h3>
                <div className="space-y-4">
                  {availableCurrencies.map(currency => (
                    <div key={currency} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={`currency-${currency}`} 
                          checked={enabledCurrencies.includes(currency)}
                          onCheckedChange={(checked) => handleCurrencyToggle(currency, checked as boolean)}
                        />
                        <div className="grid gap-1.5">
                          <Label htmlFor={`currency-${currency}`} className="font-medium">
                            {currency} - {currency === 'EUR' ? 'Euro' : currency === 'USD' ? 'Dollar Américain' : 'Livre Sterling'}
                          </Label>
                          {currency === defaultCurrency && (
                            <p className="text-sm text-muted-foreground">Devise par défaut</p>
                          )}
                        </div>
                      </div>
                      {currency !== defaultCurrency && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetAsDefault(currency)}
                          disabled={!enabledCurrencies.includes(currency)}
                        >
                          Définir par défaut
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Options d'affichage</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-currency-symbol">Afficher le symbole monétaire</Label>
                      <p className="text-sm text-muted-foreground">
                        Afficher le symbole de la devise (€, $, £) à côté des montants
                      </p>
                    </div>
                    <Switch id="show-currency-symbol" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-currency-code">Afficher le code de la devise</Label>
                      <p className="text-sm text-muted-foreground">
                        Afficher le code de la devise (EUR, USD, GBP) à côté des montants
                      </p>
                    </div>
                    <Switch id="show-currency-code" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configurez les paramètres généraux de l'application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le mode sombre pour l'interface utilisateur
                  </p>
                </div>
                <Switch id="dark-mode" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les notifications pour les nouvelles activités
                  </p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
