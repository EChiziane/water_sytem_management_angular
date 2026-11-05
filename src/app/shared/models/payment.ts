export interface Payment {
  id: string;

  referenceCode: string;

  customerId: string;
  customerCode?: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  customerValve: number;
  monthlyFee: number;

  amount: number;
  tax: number;
  unitPrice: number;

  confirmed: boolean;

  referenceMonth: string;
  numMonths: number;
  /** Demo allocation snapshots; persisted API allocations remain authoritative in production. */
  periodAmounts?: Record<string, number>;

  paymentDate: string;
  paymentMethod: string;

  createdBy: string;
  createdByName: string;
}
