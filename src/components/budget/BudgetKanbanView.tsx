
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Budget } from '@/models/Budget';
import { formatCurrency } from '@/services/budgetService';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface BudgetKanbanViewProps {
  budgets: Budget[];
}

type GroupingKey = 'type' | 'recognition' | 'status';

type BudgetStatus = 'done' | 'ongoing' | 'future' | 'undated';

const getBudgetStatus = (budget: Budget): BudgetStatus => {
  if (!budget.startDate || !budget.endDate) return 'undated';
  const now = new Date();
  if (budget.endDate < now) return 'done';
  if (budget.startDate > now) return 'future';
  return 'ongoing';
};

interface KanbanColumn {
  key: string;
  title: string;
  subtitle?: string;
  filter: (b: Budget) => boolean;
  hideIfEmpty?: boolean;
}

const GROUPINGS: Record<GroupingKey, { label: string; columns: KanbanColumn[] }> = {
  type: {
    label: 'Type de budget',
    columns: [
      { key: 'project', title: 'Projet', filter: b => b.type === 'Project' },
      { key: 'ga', title: 'G&A', filter: b => b.type === 'G&A' },
      { key: 'other', title: 'Autre', filter: b => b.type !== 'Project' && b.type !== 'G&A', hideIfEmpty: true },
    ],
  },
  recognition: {
    label: 'Reconnaissance',
    columns: [
      { key: 'linear', title: 'Linéaire', subtitle: 'Reconnaissance au prorata de la période', filter: b => b.recognitionType === 'linear' },
      { key: 'completion', title: 'Complété', subtitle: 'Reconnaissance à l\'avancement', filter: b => b.recognitionType === 'completion' },
      { key: 'other', title: 'Autre', filter: b => b.recognitionType !== 'linear' && b.recognitionType !== 'completion', hideIfEmpty: true },
    ],
  },
  status: {
    label: 'Statut',
    columns: [
      { key: 'ongoing', title: 'En cours', subtitle: 'Période en cours', filter: b => getBudgetStatus(b) === 'ongoing' },
      { key: 'future', title: 'Futur', subtitle: 'Période pas encore commencée', filter: b => getBudgetStatus(b) === 'future' },
      { key: 'done', title: 'Terminé', subtitle: 'Période échue', filter: b => getBudgetStatus(b) === 'done' },
      { key: 'undated', title: 'Sans période', filter: b => getBudgetStatus(b) === 'undated', hideIfEmpty: true },
    ],
  },
};

const BudgetKanbanView: React.FC<BudgetKanbanViewProps> = ({ budgets }) => {
  const navigate = useNavigate();
  const [grouping, setGrouping] = useState<GroupingKey>('type');

  const handleBudgetClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  const renderBudgetCard = (budget: Budget) => (
    <Card
      key={budget.id}
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleBudgetClick(budget)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-1">{budget.type}</Badge>
          <Badge
            variant={budget.availableAmount > 0 ? "outline" : "destructive"}
            className={budget.availableAmount > 0 ? "bg-green-50 text-green-700 border-green-200" : ""}
          >
            {budget.availableAmount > 0 ? 'Actif' : 'Épuisé'}
          </Badge>
        </div>
        <CardTitle className="text-base mt-1">{budget.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs text-gray-500">Initial</p>
            <p className="font-medium text-sm">{formatCurrency(budget.currency, budget.initialAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Disponible</p>
            <p className={`font-medium text-sm ${
              budget.availableAmount < 0 ? 'text-red-600' : budget.availableAmount > 0 ? 'text-green-600' : ''
            }`}>
              {formatCurrency(budget.currency, budget.availableAmount)}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          {budget.startDate && budget.endDate ? (
            <span>
              {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
            </span>
          ) : (
            <span>Pas de dates définies</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const columns = GROUPINGS[grouping].columns
    .map(col => ({ ...col, items: budgets.filter(col.filter) }))
    .filter(col => !(col.hideIfEmpty && col.items.length === 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Regrouper par</span>
        <Select value={grouping} onValueChange={(v) => setGrouping(v as GroupingKey)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GROUPINGS) as GroupingKey[]).map(key => (
              <SelectItem key={key} value={key}>{GROUPINGS[key].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${columns.length >= 4 ? 'md:grid-cols-4' : columns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {columns.map(col => (
          <div key={col.key}>
            <div className="bg-gray-100 p-3 rounded-t-md border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{col.title}</h3>
                <Badge variant="secondary">{col.items.length}</Badge>
              </div>
              {col.subtitle && <p className="text-xs text-gray-500">{col.subtitle}</p>}
            </div>
            <div className="bg-gray-50 p-3 rounded-b-md min-h-[300px]">
              {col.items.length > 0 ? (
                col.items.map(renderBudgetCard)
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <p>Aucun budget</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetKanbanView;
