export interface MonthlyCharge {
  id: string;

  referenceMonth: string;

  paid: boolean;

  paidAt: string;

  amount: number;
  amountEstimated?: boolean;

  customerNameSnapshot: string;

  customerContactSnapshot: string;

  customerAddressSnapshot: string;

  valveSnapshot: string;

  customerStatusSnapshot: string;

  paymentId: string;

  paymentReferenceCode: string;

  paymentMethod: string;

  createdByName: string;

  paymentDate: string;
}
