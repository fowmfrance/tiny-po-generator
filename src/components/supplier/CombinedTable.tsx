
import React from 'react';
import { Calendar, FileText, ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/purchase-orders/StatusBadge';
import { PurchaseOrderWithInvoices } from '@/types/supplier';

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
        <p className="text-gray-500">No records found in this category.</p>
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
          <TableHead>PO Number</TableHead>
          <TableHead>
            <button 
              className="flex items-center font-medium text-left"
              onClick={() => onSort('amount')}
            >
              Amount
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
              Status
              {sortBy === 'status' && (
                <span className="ml-1">{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}</span>
              )}
            </button>
          </TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Payment Status</TableHead>
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
              {po.currency} {po.amount.toLocaleString()}
            </TableCell>
            <TableCell>
              <StatusBadge status={po.status} />
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices.map((inv: any) => (
                    <div key={inv.id} className="text-sm">
                      {inv.invoiceNumber}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">None</span>
              )}
            </TableCell>
            <TableCell>
              {po.hasInvoice ? (
                <div className="space-y-1">
                  {po.invoices.map((inv: any) => (
                    <div key={inv.id}>
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">—</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.open(`/purchase-orders/${po.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  View PO
                </Button>
                
                {po.status === 'approved' && !po.hasInvoice && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-po-blue hover:bg-blue-600 flex items-center gap-1"
                    onClick={() => navigate(`/supplier/invoices/create?po=${po.id}`)}
                  >
                    <Plus className="h-4 w-4" />
                    Invoice
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
