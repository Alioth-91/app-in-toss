export type Participant = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  participantIds: string[];
};

export type SettlementInput = {
  title: string;
  participants: Participant[];
  expenses: Expense[];
};

export type SettlementRecord = SettlementInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type ValidationIssue = {
  path: string;
  message: string;
};
