import React, { useState, useEffect } from 'react';
import { Flag, AlertCircle, Users, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MilestoneTimelineView, MilestoneWithSupplier } from './MilestoneTimelineView';
import { PerSupplierMilestoneView, SupplierBlock } from './PerSupplierMilestoneView';
import { supabase } from '@/integrations/supabase/client';
import { MilestoneMode } from '@/models/Budget';

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
  supplierTypeId?: string | null;
  supplierTypeIdOriginal?: string | null;
  articleTypeId?: string | null;
  assignmentStatus?: 'pending' | 'assigned' | 'confirmed';
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
  milestoneMode?: MilestoneMode;
  onMilestoneModeChange?: (mode: MilestoneMode) => void;
  supplierBlocks?: SupplierBlock[];
  onSupplierBlocksChange?: (blocks: SupplierBlock[]) => void;
}

export const MilestoneTimelineDialog: React.FC<MilestoneTimelineDialogProps> = ({
  open,
  onOpenChange,
  milestones,
  onMilestonesChange,
  projectStartDate,
  projectEndDate,
  milestoneMode = 'global',
  onMilestoneModeChange,
  supplierBlocks = [],
  onSupplierBlocksChange,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [currentMode, setCurrentMode] = useState<MilestoneMode>(milestoneMode);

  useEffect(() => {
    setCurrentMode(milestoneMode);
  }, [milestoneMode]);

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

  const handleModeChange = (newMode: string) => {
    const mode = newMode as MilestoneMode;
    setCurrentMode(mode);
    onMilestoneModeChange?.(mode);
  };

  const totalMilestonesCount = currentMode === 'global' 
    ? milestones.length 
    : supplierBlocks.reduce((sum, block) => sum + block.milestones.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Définir les jalons du projet (Milestones)
          </DialogTitle>
          <DialogDescription>
            Choisissez le mode de gestion des jalons et définissez vos livrables.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentMode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Jalons globaux
            </TabsTrigger>
            <TabsTrigger value="per_supplier" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jalons par prestataire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <MilestoneTimelineView
              milestones={milestones as MilestoneWithSupplier[]}
              onMilestonesChange={(updatedMilestones) => onMilestonesChange(updatedMilestones as Milestone[])}
              projectStartDate={projectStartDate}
              projectEndDate={projectEndDate}
              suppliers={suppliers}
              readOnly={false}
            />
          </TabsContent>

          <TabsContent value="per_supplier" className="mt-4">
            <PerSupplierMilestoneView
              blocks={supplierBlocks}
              onBlocksChange={(blocks) => onSupplierBlocksChange?.(blocks)}
              projectStartDate={projectStartDate}
              projectEndDate={projectEndDate}
              readOnly={false}
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            {currentMode === 'global' ? (
              <>
                <p className="font-medium">Mode Jalons globaux</p>
                <p className="mt-1 text-blue-600 dark:text-blue-300">
                  Définissez des livrables libres sur la timeline. Vous pouvez optionnellement 
                  rattacher un fournisseur à chaque jalon.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Mode Jalons par prestataire</p>
                <p className="mt-1 text-blue-600 dark:text-blue-300">
                  Organisez vos livrables par type de prestataire et sélectionnez des articles 
                  depuis votre catalogue. L'avancement sera calculé par prestataire puis agrégé.
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Valider les jalons ({totalMilestonesCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
