import {CarloadInvoiceItem} from "../carload-invoice-item";

export type CarloadInvoiceDescription = 'AREIA_GROSSA' | 'PEDRA';

export interface CarloadInvoice {
  id: string;
  carloadCustomerId: string;
  carloadCustomerName:string;
  invoiceCode: string;
  items: CarloadInvoiceItem[];
  description: CarloadInvoiceDescription;
  quantity: number;
  unitPrice: number;
  amount: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  fileName: string;
  filePath: string;
  createdAt: string;
}
