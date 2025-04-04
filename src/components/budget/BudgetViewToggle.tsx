
import React from 'react';
import { LayoutGrid, LayoutList, Kanban } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewType = 'list' | 'grid' | 'kanban';

interface BudgetViewToggleProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BudgetViewToggle: React.FC<BudgetViewToggleProps> = ({ 
  activeView, 
  onViewChange 
}) => {
  return (
    <ToggleGroup type="single" value={activeView} onValueChange={(value) => value && onViewChange(value as ViewType)}>
      <ToggleGroupItem value="list" aria-label="Vue liste" className="px-3">
        <LayoutList className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Liste</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Vue carte" className="px-3">
        <LayoutGrid className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Cartes</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="kanban" aria-label="Vue kanban" className="px-3">
        <Kanban className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Kanban</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default BudgetViewToggle;
