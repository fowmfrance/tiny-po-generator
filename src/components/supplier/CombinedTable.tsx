
import React from 'react';
import { Calendar, FileText, ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { PurchaseOrderWithInvoices } from '@/types/supplier';
import { PurchaseOrderStatus } from '@/pages/PurchaseOrders';

interface CombinedTableProps {
  data: PurchaseOrderWithInvoices[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  navigate: (path: string) => void;
}

const CombinedTable: React.FC<CombinedTableProps> = ({ 
  data, 
  sortBy, 
  sortOrder,
  onSort,
  navigate 
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">Aucun enregistrement trouvé dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('date')}
            >
              Date
              {sortBy === 'date' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>N° BC</TableHead>
          <TableHead>
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('amount')}
            >
              Montant
              {sortBy === 'amount' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('status')}
            >
              Statut
              {sortBy === 'status' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>Facture</TableHead>
          <TableHead>Statut paiement</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(po => (
          <TableRow key={po.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {po.date}
              </div>
            </TableCell>
            <TableCell>{po.poNumber}</TableCell>
            <TableCell>
              {po.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {po.currency}
            </TableCell>
            <TableCell>
              <StatusBadge status={po.status as PurchaseOrderStatus} />
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices?.map((inv) => (
                    <div key={inv.id} className="text-sm">
                      {inv.invoiceNumber}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Aucune</span>
              )}
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices?.map((inv) => (
                    <div key={inv.id}>
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/purchase-orders/${po.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Voir BC
                </Button>
                {po.status === 'approved' && !po.hasInvoice && (
                  <Button 
                    size="sm" 
                    className="bg-po-blue hover:bg-blue-600"
                    onClick={() => navigate(`/supplier/invoices/create?po=${po.id}`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Facturer
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CombinedTable;
