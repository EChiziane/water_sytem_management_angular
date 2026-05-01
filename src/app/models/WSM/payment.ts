export interface Payment {
  id: string;
  referenceCode: string; // 👈 NOVO

  customerId: string;
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
  createdBy: string;
  createdByName: string;

  paymentDate: string;
  paymentMethod: string;
}
