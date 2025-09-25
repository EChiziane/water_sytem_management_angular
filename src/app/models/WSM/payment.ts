export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  numMonths: number;
  referenceMonth: string;
  paymentMethod:'EMOLA,MPESA,BCI,NUMERARIO';
  confirmed: boolean;
  paymentDate: string;
}



