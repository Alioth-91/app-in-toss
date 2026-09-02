import type { Expense } from "./settlement";

export type ExpenseDraft = Omit<Expense, "id">;

export function createBlankExpenseDraft(
  participantIds: readonly string[],
): ExpenseDraft {
  return {
    description: "",
    amount: 0,
    payerId: "",
    participantIds: [...participantIds],
  };
}
