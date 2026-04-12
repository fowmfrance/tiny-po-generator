
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Download,
  CalendarRange,
  Send,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BudgetCurrency, BudgetRecognitionType, formatCurrency } from '@/services/budgetService';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Budget } from '@/models/Budget';

interface BudgetListProps {
  budgets: Budget[];
}

type SortKey = 'code' | 'name' | 'type' | 'initialAmount' | 'sentAmount' | 'receivedAmount' | 'remainingAmount' | 'availableAmount' | 'currency' | 'recognitionType' | 'startDate' | 'poCount';
type SortDir = 'asc' | 'desc';

const BudgetList: React.FC<BudgetListProps> = ({ budgets }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return budgets;
    const q = search.toLowerCase();
    return budgets.filter(b =>
      b.code.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q) ||
      (b.clientName && b.clientName.toLowerCase().includes(q))
    );
  }, [budgets, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      const key = sortKey;
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) cmp = 0;
      else if (av == null) cmp = -1;
      else if (bv == null) cmp = 1;
      else if (typeof av === 'string' && typeof bv === 'string') cmp = av.localeCompare(bv);
      else if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return null;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };

  const SortableHead = ({ colKey, children, className }: { colKey: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${className || ''}`}
      onClick={() => handleSort(colKey)}
    >
      {children}<SortIcon colKey={colKey} />
    </TableHead>
  );

  const handleBudgetRowClick = (budget: Budget) => {
    navigate(`/budgets/${budget.id}`);
  };

  const handleSendPO = (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    if (budget.remainingAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Impossible d'envoyer un BC",
        description: "Ce budget n'a plus de montant disponible.",
      });
      return;
    }
    navigate('/purchase-orders/create', { 
      state: { 
        budgetId: budget.id,
        budgetName: budget.name,
        budgetCode: budget.code,
        budgetCurrency: budget.currency,
        budgetStartDate: budget.startDate,
        budgetEndDate: budget.endDate,
        budgetRecognitionType: budget.recognitionType,
        budgetCompletionPercentage: budget.completionPercentage
      } 
    });
  };

  const handleAdjustBudget = (budget: Budget) => {
    toast({
      title: "Budget ajusté",
      description: `Le budget ${budget.code} a été ajusté au montant envoyé: ${formatCurrency(budget.currency, budget.sentAmount)}`,
    });
  };

  const ColumnWithTooltip = ({ title, tooltipText, colKey, className }: { title: string; tooltipText: string; colKey: SortKey; className?: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TableHead
            className={`cursor-pointer select-none hover:text-foreground ${className || ''}`}
            onClick={() => handleSort(colKey)}
          >
            <div className="flex items-center">
              {title}<SortIcon colKey={colKey} />
            </div>
          </TableHead>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un budget..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead colKey="code">Code</SortableHead>
            <SortableHead colKey="name">Nom</SortableHead>
            <SortableHead colKey="type" className="text-center">Type</SortableHead>
            <SortableHead colKey="initialAmount" className="text-right">Montant Initial</SortableHead>
            <ColumnWithTooltip colKey="sentAmount" title="Envoyé" tooltipText="Somme des BC envoyés, tous statuts confondus" className="text-right" />
            <ColumnWithTooltip colKey="receivedAmount" title="Reçu" tooltipText="BC envoyés et factures reçues" className="text-right" />
            <ColumnWithTooltip colKey="remainingAmount" title="Restant" tooltipText="BC envoyés mais factures en attente de réception, ou rejetées et en attente de mise à jour" className="text-right" />
            <ColumnWithTooltip colKey="availableAmount" title="Disponible" tooltipText="Reliquat disponible pour envoi ou économie potentielle par rapport au budget si le projet est terminé" className="text-right" />
            <SortableHead colKey="currency" className="text-center">Devise</SortableHead>
            <SortableHead colKey="recognitionType" className="text-center">Reconnaissance</SortableHead>
            <SortableHead colKey="startDate" className="text-center">Période</SortableHead>
            <SortableHead colKey="poCount" className="text-center">BCs</SortableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                Aucun budget trouvé
              </TableCell>
            </TableRow>
          ) : sorted.map((budget) => (
            <TableRow 
              key={budget.id} 
              onClick={() => handleBudgetRowClick(budget)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">{budget.code}</TableCell>
              <TableCell>{budget.name}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{budget.type}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.currency, budget.initialAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.currency, budget.sentAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.currency, budget.receivedAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.currency, budget.remainingAmount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(budget.currency, budget.availableAmount)}
              </TableCell>
              <TableCell className="text-center">{budget.currency}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="capitalize">
                  {budget.recognitionType === 'linear' ? 'Linéaire' : 'Complété'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {budget.startDate && budget.endDate ? (
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <CalendarRange className="h-3 w-3 mr-1" />
                    <span>
                      {budget.startDate.toLocaleDateString()} - {budget.endDate.toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Pas de dates définies</span>
                )}
              </TableCell>
              <TableCell className="text-center">{budget.poCount}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={(e) => handleSendPO(e, budget)}
                    disabled={budget.availableAmount <= 0}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Envoyer BC
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAdjustBudget(budget)}>
                        <Edit className="mr-2 h-4 w-4" /> Ajuster le budget au montant envoyé
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" /> Télécharger
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BudgetList;
