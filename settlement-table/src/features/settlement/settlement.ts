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

export function resolveSettlementTitle(title: string, now: Date): string {
  const normalized = title.trim();
  if (normalized.length > 0) {
    return normalized;
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
