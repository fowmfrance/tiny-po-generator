import React, { useState, useMemo } from 'react';
import { format, differenceInDays, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  CalendarDays,
  User,
  Search,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SupplierSearchModal, SupplierResult } from './SupplierSearchModal';
import InviteVendorDialog from '@/components/vendors/InviteVendorDialog';

export interface PerSupplierMilestone {
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
  assignmentStatus: 'pending' | 'assigned' | 'confirmed';
}

export interface SupplierBlock {
  id: string;
  supplierTypeId: string;
  supplierTypeName: string;
  supplierTypeColor?: string;
  supplierId?: string | null;
  supplierName?: string;
  milestones: PerSupplierMilestone[];
  assignmentStatus: 'pending' | 'assigned' | 'confirmed';
}

interface ArticleType {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  default_unit_price?: number | null;
}

interface SupplierType {
  id: string;
  name: string;
  color?: string | null;
}

interface PerSupplierMilestoneViewProps {
  blocks: SupplierBlock[];
  onBlocksChange: (blocks: SupplierBlock[]) => void;
  projectStartDate?: Date;
  projectEndDate?: Date;
  readOnly?: boolean;
}

export const PerSupplierMilestoneView: React.FC<PerSupplierMilestoneViewProps> = ({
  blocks,
  onBlocksChange,
  projectStartDate,
  projectEndDate,
  readOnly = false,
}) => {
  const [addingBlock, setAddingBlock] = useState(false);
  const [selectedSupplierTypeId, setSelectedSupplierTypeId] = useState<string>('');
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [articleDescriptions, setArticleDescriptions] = useState<Record<string, string>>({});
  const [articleDates, setArticleDates] = useState<Record<string, string>>({});

  // Fetch supplier types
  const { data: supplierTypes = [] } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_types')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as SupplierType[];
    },
  });

  // Fetch article types based on selected supplier type
  const { data: articleTypes = [] } = useQuery({
    queryKey: ['article-types', selectedSupplierTypeId],
    queryFn: async () => {
      if (!selectedSupplierTypeId) return [];
      const { data, error } = await supabase
        .from('article_types')
        .select('id, name, description, unit, default_unit_price')
        .eq('supplier_type_id', selectedSupplierTypeId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ArticleType[];
    },
    enabled: !!selectedSupplierTypeId,
  });

  // Toggle block expansion
  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  // Calculate percentages for milestones within a block
  const calculateBlockPercentages = (milestones: PerSupplierMilestone[]): PerSupplierMilestone[] => {
    const totalMilestones = milestones.length;
    if (totalMilestones === 0) return milestones;
    
    const percentagePerMilestone = 100 / totalMilestones;
    
    return milestones.map((item, index) => ({
      ...item,
      completionPercentage: Math.round(percentagePerMilestone * (index + 1) * 100) / 100,
      orderIndex: index,
    }));
  };

  // Add a new supplier block
  const handleAddBlock = () => {
    if (!selectedSupplierTypeId) return;

    const supplierType = supplierTypes.find(t => t.id === selectedSupplierTypeId);
    if (!supplierType) return;

    // Create milestones from selected articles
    const newMilestones: PerSupplierMilestone[] = Array.from(selectedArticles).map((articleId, index) => {
      const article = articleTypes.find(a => a.id === articleId);
      return {
        id: crypto.randomUUID(),
        title: article?.name || 'Livrable',
        description: articleDescriptions[articleId] || '',
        targetDate: articleDates[articleId] 
          ? new Date(articleDates[articleId]) 
          : projectStartDate || new Date(),
        completionPercentage: 0,
        isCompleted: false,
        orderIndex: index,
        supplierTypeId: selectedSupplierTypeId,
        supplierTypeIdOriginal: selectedSupplierTypeId,
        articleTypeId: articleId,
        assignmentStatus: 'pending' as const,
      };
    });

    const newBlock: SupplierBlock = {
      id: crypto.randomUUID(),
      supplierTypeId: selectedSupplierTypeId,
      supplierTypeName: supplierType.name,
      supplierTypeColor: supplierType.color || undefined,
      milestones: calculateBlockPercentages(
        newMilestones.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
      ),
      assignmentStatus: 'pending',
    };

    onBlocksChange([...blocks, newBlock]);
    setExpandedBlocks(new Set([...expandedBlocks, newBlock.id]));
    
    // Reset form
    setAddingBlock(false);
    setSelectedSupplierTypeId('');
    setSelectedArticles(new Set());
    setArticleDescriptions({});
    setArticleDates({});
  };

  // Remove a block
  const handleRemoveBlock = (blockId: string) => {
    onBlocksChange(blocks.filter(b => b.id !== blockId));
  };

  // Remove a milestone from a block
  const handleRemoveMilestone = (blockId: string, milestoneId: string) => {
    onBlocksChange(blocks.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        milestones: calculateBlockPercentages(
          block.milestones.filter(m => m.id !== milestoneId)
        ),
      };
    }));
  };

  // Open search modal for a specific block
  const handleOpenSearchModal = (blockId: string) => {
    setActiveBlockId(blockId);
    setSearchModalOpen(true);
  };

  // Open invite dialog for a specific block
  const handleOpenInviteDialog = (blockId: string) => {
    setActiveBlockId(blockId);
    setInviteDialogOpen(true);
  };

  // Handle supplier selection from search modal
  const handleSupplierSelect = (supplier: SupplierResult) => {
    if (!activeBlockId) return;

    onBlocksChange(blocks.map(block => {
      if (block.id !== activeBlockId) return block;
      return {
        ...block,
        supplierId: supplier.id,
        supplierName: supplier.name,
        assignmentStatus: 'assigned' as const,
        milestones: block.milestones.map(m => ({
          ...m,
          supplierId: supplier.id,
          supplierName: supplier.name,
          assignmentStatus: 'assigned' as const,
        })),
      };
    }));
    setActiveBlockId(null);
  };

  // Toggle article selection
  const toggleArticleSelection = (articleId: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId);
    } else {
      newSelected.add(articleId);
    }
    setSelectedArticles(newSelected);
  };

  // Calculate global progress
  const globalProgress = useMemo(() => {
    if (blocks.length === 0) return 0;
    
    const blockProgresses = blocks.map(block => {
      const completedCount = block.milestones.filter(m => m.isCompleted).length;
      return block.milestones.length > 0 ? completedCount / block.milestones.length : 0;
    });
    
    return (blockProgresses.reduce((a, b) => a + b, 0) / blocks.length) * 100;
  }, [blocks]);

  // Get active block's supplier type info
  const activeBlock = blocks.find(b => b.id === activeBlockId);

  return (
    <div className="space-y-4">
      {/* Global progress */}
      {blocks.length > 0 && (
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Avancement global</span>
            <span className="text-muted-foreground">
              {blocks.length} bloc(s) prestataire
            </span>
          </div>
          <Progress value={globalProgress} className="h-3" />
          <div className="text-right text-sm font-medium">
            {globalProgress.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Supplier blocks */}
      <div className="space-y-3">
        {blocks.map((block) => {
          const blockProgress = block.milestones.length > 0
            ? (block.milestones.filter(m => m.isCompleted).length / block.milestones.length) * 100
            : 0;

          return (
            <Collapsible
              key={block.id}
              open={expandedBlocks.has(block.id)}
              onOpenChange={() => toggleBlockExpansion(block.id)}
            >
              <div 
                className={cn(
                  "border rounded-lg overflow-hidden",
                  block.assignmentStatus === 'pending' && "border-orange-300 dark:border-orange-700",
                  block.assignmentStatus === 'assigned' && "border-blue-300 dark:border-blue-700",
                  block.assignmentStatus === 'confirmed' && "border-green-300 dark:border-green-700",
                )}
              >
                {/* Block header */}
                <CollapsibleTrigger asChild>
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      block.assignmentStatus === 'pending' && "bg-orange-50 dark:bg-orange-950/20",
                      block.assignmentStatus === 'assigned' && "bg-blue-50 dark:bg-blue-950/20",
                      block.assignmentStatus === 'confirmed' && "bg-green-50 dark:bg-green-950/20",
                    )}
                  >
                    {expandedBlocks.has(block.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}

                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: block.supplierTypeColor || '#6B7280' }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{block.supplierTypeName}</span>
                        {block.supplierName ? (
                          <Badge variant="secondary" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {block.supplierName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente d'affectation
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={blockProgress} className="h-1.5 flex-1 max-w-[200px]" />
                        <span className="text-xs text-muted-foreground">
                          {blockProgress.toFixed(0)}% ({block.milestones.filter(m => m.isCompleted).length}/{block.milestones.length})
                        </span>
                      </div>
                    </div>

                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBlock(block.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-3">
                    {/* Search/Invite supplier buttons */}
                    {!block.supplierId && !readOnly && (
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSearchModal(block.id)}
                          className="flex-1"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Rechercher un fournisseur
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInviteDialog(block.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Inviter
                        </Button>
                      </div>
                    )}

                    {/* Milestones list */}
                    {block.milestones.map((milestone, index) => (
                      <div 
                        key={milestone.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          milestone.isCompleted 
                            ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
                            : "bg-background hover:bg-muted/30"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{milestone.title}</span>
                            {milestone.isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {milestone.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              {format(milestone.targetDate, 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="text-xs font-medium">
                              → {milestone.completionPercentage.toFixed(0)}% d'avancement
                            </span>
                          </div>
                        </div>
                        
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMilestone(block.id, milestone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Add block form */}
      {!readOnly && (
        <>
          {addingBlock ? (
            <div className="border-2 border-dashed border-primary/50 rounded-lg p-4 space-y-4 bg-primary/5">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Nouveau bloc prestataire
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddingBlock(false);
                    setSelectedSupplierTypeId('');
                    setSelectedArticles(new Set());
                  }}
                >
                  Annuler
                </Button>
              </div>

              {/* Supplier type selection */}
              <div className="space-y-2">
                <Label>Type de fournisseur</Label>
                <Select
                  value={selectedSupplierTypeId}
                  onValueChange={setSelectedSupplierTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type de fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color || '#6B7280' }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Articles selection */}
              {selectedSupplierTypeId && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Livrables du catalogue ({articleTypes.length})
                  </Label>
                  
                  {articleTypes.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
                      Aucun article défini pour ce type de fournisseur
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {articleTypes.map((article) => (
                        <div
                          key={article.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            selectedArticles.has(article.id)
                              ? "bg-primary/10 border-primary"
                              : "bg-background hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedArticles.has(article.id)}
                              onCheckedChange={() => toggleArticleSelection(article.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{article.name}</span>
                                {article.unit && (
                                  <span className="text-xs text-muted-foreground">
                                    par {article.unit}
                                  </span>
                                )}
                              </div>
                              {article.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {article.description}
                                </p>
                              )}
                              
                              {selectedArticles.has(article.id) && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Date prévue</Label>
                                    <Input
                                      type="date"
                                      value={articleDates[article.id] || ''}
                                      onChange={(e) => setArticleDates({
                                        ...articleDates,
                                        [article.id]: e.target.value,
                                      })}
                                      min={projectStartDate?.toISOString().split('T')[0]}
                                      max={projectEndDate?.toISOString().split('T')[0]}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Commentaire</Label>
                                    <Input
                                      placeholder="Détails..."
                                      value={articleDescriptions[article.id] || ''}
                                      onChange={(e) => setArticleDescriptions({
                                        ...articleDescriptions,
                                        [article.id]: e.target.value,
                                      })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAddBlock}
                disabled={!selectedSupplierTypeId || selectedArticles.size === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ce bloc ({selectedArticles.size} livrable{selectedArticles.size > 1 ? 's' : ''})
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setAddingBlock(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un bloc prestataire
            </Button>
          )}
        </>
      )}

      {/* Empty state */}
      {blocks.length === 0 && !addingBlock && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun bloc prestataire défini</p>
          {!readOnly && (
            <p className="text-sm mt-1">
              Cliquez sur le bouton ci-dessus pour ajouter un prestataire et ses livrables
            </p>
          )}
        </div>
      )}

      {/* Supplier search modal */}
      <SupplierSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSupplierSelect={handleSupplierSelect}
        onInviteNew={() => {
          setSearchModalOpen(false);
          if (activeBlockId) {
            handleOpenInviteDialog(activeBlockId);
          }
        }}
        expectedSupplierTypeId={activeBlock?.supplierTypeId}
        expectedSupplierTypeName={activeBlock?.supplierTypeName}
      />

      {/* Invite vendor dialog */}
      <InviteVendorDialog
        isOpen={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
};
