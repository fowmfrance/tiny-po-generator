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
import { Input } from "@/components/ui/input";
import { availableCurrencies, BudgetCurrency, defaultCurrency } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';
import { Euro, Wallet, Settings as SettingsIcon, Tags, Hash, Building2, Briefcase, ShieldCheck } from 'lucide-react';
import ExpenseCategoriesTab from '@/components/settings/ExpenseCategoriesTab';
import NumberingTab from '@/components/settings/NumberingTab';
import BankMappingTab from '@/components/settings/BankMappingTab';
import SupplierCatalogTab from '@/components/settings/SupplierCatalogTab';
import KYCSettingsTab from '@/components/settings/KYCSettingsTab';

interface CurrencyRate {
  currency: BudgetCurrency;
  rate: number;
  lastUpdated: Date;
}

const Settings = () => {
  const { toast } = useToast();
  const [enabledCurrencies, setEnabledCurrencies] = useState<BudgetCurrency[]>(['EUR', 'USD', 'GBP']);
  const [defaultCurrency, setDefaultCurrency] = useState<BudgetCurrency>('EUR');
  
  const currentDate = new Date();
  // Exchange rates relative to EUR (1 EUR = X units of currency)
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([
    { currency: 'EUR', rate: 1.0, lastUpdated: currentDate },
    { currency: 'USD', rate: 1.0869, lastUpdated: currentDate }, // 1 EUR = 1.0869 USD
    { currency: 'GBP', rate: 0.8531, lastUpdated: currentDate }, // 1 EUR = 0.8531 GBP
  ]);
  
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

  const handleRateChange = (currency: BudgetCurrency, newRate: string) => {
    const rateValue = parseFloat(newRate);
    if (!isNaN(rateValue) && rateValue > 0) {
      setCurrencyRates(prev => 
        prev.map(rate => 
          rate.currency === currency 
            ? { ...rate, rate: rateValue, lastUpdated: new Date() } 
            : rate
        )
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-gray-500">Gérez les paramètres de votre application.</p>
      </div>
      
      <Tabs defaultValue="numbering">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="numbering">
            <Hash className="h-4 w-4 mr-2" />
            Numérotation
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tags className="h-4 w-4 mr-2" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="bank-mapping">
            <Building2 className="h-4 w-4 mr-2" />
            Mapping Banques
          </TabsTrigger>
          <TabsTrigger value="supplier-catalog">
            <Briefcase className="h-4 w-4 mr-2" />
            Fournisseurs & Prestations
          </TabsTrigger>
          <TabsTrigger value="currencies">
            <Euro className="h-4 w-4 mr-2" />
            Devises
          </TabsTrigger>
          <TabsTrigger value="rates">
            <Wallet className="h-4 w-4 mr-2" />
            Taux de Change
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="numbering" className="mt-6">
          <NumberingTab />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <ExpenseCategoriesTab />
        </TabsContent>
        
        <TabsContent value="bank-mapping" className="mt-6">
          <BankMappingTab />
        </TabsContent>
        
        <TabsContent value="supplier-catalog" className="mt-6">
          <SupplierCatalogTab />
        </TabsContent>

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
        
        <TabsContent value="rates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Taux de Change</CardTitle>
              <CardDescription>
                Gérez les taux de change utilisés pour convertir les montants entre devises.
                Taux en date du {currentDate.toLocaleDateString()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Taux par rapport à l'Euro (EUR)</h3>
                <div className="space-y-4">
                  {currencyRates
                    .filter(rate => rate.currency !== 'EUR')
                    .map(rate => (
                    <div key={rate.currency} className="flex items-center justify-between border-b pb-3">
                      <div className="grid gap-1.5">
                        <Label className="font-medium">
                          {rate.currency} - {rate.currency === 'USD' ? 'Dollar Américain' : 'Livre Sterling'}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Dernière mise à jour: {rate.lastUpdated.toLocaleDateString()} à {rate.lastUpdated.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium whitespace-nowrap mr-2">
                          1 EUR =
                        </div>
                        <div className="w-32">
                          <Input 
                            type="number"
                            value={rate.rate}
                            onChange={(e) => handleRateChange(rate.currency, e.target.value)}
                            step="0.0001"
                            min="0"
                          />
                        </div>
                        <div className="text-sm font-medium">
                          {rate.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Les taux affichés sont utilisés pour calculer les équivalents en EUR dans toute l'application.</p>
                  <p>Dans un environnement de production, ces taux seraient mis à jour automatiquement via une API de taux de change.</p>
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
