
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BudgetHeaderProps {
  title: string;
  description: string;
}

const BudgetHeader: React.FC<BudgetHeaderProps> = ({ title, description }) => {
  const navigate = useNavigate();

  const handleCreateBudget = () => {
    navigate('/budgets/create');
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Button onClick={handleCreateBudget}>
        <Plus className="w-4 h-4 mr-2" />
        Créer Budget
      </Button>
    </div>
  );
};

export default BudgetHeader;
