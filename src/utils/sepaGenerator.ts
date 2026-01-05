import { format } from 'date-fns';
import type { SupplierPaymentGroup } from '@/types/payment';

interface DebtorInfo {
  name: string;
  iban: string;
  bic: string;
}

interface CreditorBankInfo {
  iban: string;
  bic: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateMessageId(): string {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMddHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MSG${dateStr}${random}`;
}

function generatePaymentInfoId(index: number): string {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMddHHmmss');
  return `PMT${dateStr}${String(index).padStart(3, '0')}`;
}

function generateEndToEndId(supplierName: string, index: number): string {
  const cleanName = supplierName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  const dateStr = format(new Date(), 'yyyyMMdd');
  return `${cleanName}${dateStr}${String(index).padStart(4, '0')}`;
}

export function generateSepaXml(
  paymentGroups: SupplierPaymentGroup[],
  debtor: DebtorInfo,
  creditorBankInfo: Map<string, CreditorBankInfo>, // supplier_id -> bank info
  executionDate: Date = new Date()
): string {
  // Group by currency
  const groupedByCurrency = new Map<string, SupplierPaymentGroup[]>();
  
  for (const group of paymentGroups) {
    if (!groupedByCurrency.has(group.currency)) {
      groupedByCurrency.set(group.currency, []);
    }
    groupedByCurrency.get(group.currency)!.push(group);
  }
  
  const messageId = generateMessageId();
  const creationDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  const requestedExecutionDate = format(executionDate, 'yyyy-MM-dd');
  
  let totalTransactions = 0;
  let totalAmount = 0;
  
  for (const groups of groupedByCurrency.values()) {
    for (const group of groups) {
      totalTransactions++;
      totalAmount += group.total_amount;
    }
  }
  
  let paymentInfoBlocks = '';
  let paymentIndex = 0;
  
  for (const [currency, groups] of groupedByCurrency) {
    paymentIndex++;
    const paymentInfoId = generatePaymentInfoId(paymentIndex);
    
    let creditTransfers = '';
    let currencyTotal = 0;
    let currencyCount = 0;
    
    for (const group of groups) {
      const bankInfo = creditorBankInfo.get(group.supplier_id);
      if (!bankInfo) continue;
      
      currencyCount++;
      currencyTotal += group.total_amount;
      
      const endToEndId = generateEndToEndId(group.supplier_name, currencyCount);
      const remittanceInfo = `Factures: ${group.invoice_numbers.join(', ')}`.substring(0, 140);
      
      creditTransfers += `
        <CdtTrfTxInf>
          <PmtId>
            <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>
          </PmtId>
          <Amt>
            <InstdAmt Ccy="${currency}">${group.total_amount.toFixed(2)}</InstdAmt>
          </Amt>
          <CdtrAgt>
            <FinInstnId>
              <BIC>${escapeXml(bankInfo.bic)}</BIC>
            </FinInstnId>
          </CdtrAgt>
          <Cdtr>
            <Nm>${escapeXml(group.supplier_name.substring(0, 70))}</Nm>
          </Cdtr>
          <CdtrAcct>
            <Id>
              <IBAN>${escapeXml(bankInfo.iban)}</IBAN>
            </Id>
          </CdtrAcct>
          <RmtInf>
            <Ustrd>${escapeXml(remittanceInfo)}</Ustrd>
          </RmtInf>
        </CdtTrfTxInf>`;
    }
    
    paymentInfoBlocks += `
    <PmtInf>
      <PmtInfId>${escapeXml(paymentInfoId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${currencyCount}</NbOfTxs>
      <CtrlSum>${currencyTotal.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${requestedExecutionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${escapeXml(debtor.name.substring(0, 70))}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${escapeXml(debtor.iban)}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${escapeXml(debtor.bic)}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>${creditTransfers}
    </PmtInf>`;
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${escapeXml(messageId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${totalTransactions}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(debtor.name.substring(0, 70))}</Nm>
      </InitgPty>
    </GrpHdr>${paymentInfoBlocks}
  </CstmrCdtTrfInitn>
</Document>`;
  
  return xml;
}

export function downloadSepaXml(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
