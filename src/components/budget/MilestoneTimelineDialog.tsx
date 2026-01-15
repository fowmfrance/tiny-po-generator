import React, { useState, useEffect } from 'react';
import { Flag, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MilestoneTimelineView, MilestoneWithSupplier } from './MilestoneTimelineView';
import { supabase } from '@/integrations/supabase/client';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  completionPercentage: number;
  isCompleted: boolean;
  orderIndex: number;
  supplierId?: string | null;
  supplierName?: string;
}

interface Supplier {
  id: string;
  name: string;
  specialty?: string;
}

interface MilestoneTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
  projectStartDate?: Date;
  projectEndDate?: Date;
}

export const MilestoneTimelineDialog: React.FC<MilestoneTimelineDialogProps> = ({
  open,
  onOpenChange,
  milestones,
  onMilestonesChange,
  projectStartDate,
  projectEndDate,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Fetch suppliers when dialog opens
  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, specialty')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Définir les jalons du projet (Milestones)
          </DialogTitle>
          <DialogDescription>
            Cliquez sur la timeline pour sélectionner une date et ajouter un jalon.
            Vous pouvez optionnellement rattacher chaque jalon à un fournisseur du catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <MilestoneTimelineView
            milestones={milestones as MilestoneWithSupplier[]}
            onMilestonesChange={(updatedMilestones) => onMilestonesChange(updatedMilestones as Milestone[])}
            projectStartDate={projectStartDate}
            projectEndDate={projectEndDate}
            suppliers={suppliers}
            readOnly={false}
          />
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Liaison fournisseur optionnelle</p>
            <p className="mt-1 text-blue-600 dark:text-blue-300">
              Vous pouvez rattacher un fournisseur à chaque jalon, même après sa création. 
              Si le fournisseur n'est pas encore enregistré, vous pourrez le lier ultérieurement.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Valider les jalons ({milestones.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
