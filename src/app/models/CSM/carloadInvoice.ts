export type CarloadInvoiceDescription = 'AREIA_GROSSA' | 'PEDRA';

export interface CarloadInvoice {
  id: string;
  carloadCustomerId: string;
  invoiceCode: string;
  description: CarloadInvoiceDescription;
  quantity: number;
  unitPrice: number;
  amount: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  createdAt: string;
}
