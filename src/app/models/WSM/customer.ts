export interface Customer {

  id: string;

  code: string;

  name: string;

  contact: string;

  address: string;

  status: string;

  valve: number;

  monthlyFee: number;

  monthsInDebt: number;

  unpaidMonths: string[];

  createdAt: string;
}
