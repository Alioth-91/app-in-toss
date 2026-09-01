import type { Expense, Participant, SettlementInput } from "./settlement";

export type PersonSettlement = {
  participantId: string;
  paidAmount: number;
  burdenAmount: number;
  netBalance: number;
};

export type Transfer = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
};

export type SettlementResult = {
  totalAmount: number;
  people: PersonSettlement[];
  transfers: Transfer[];
};

export type SettlementCalculationInput = Pick<
  SettlementInput,
  "participants" | "expenses"
>;

export class SettlementCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementCalculationError";
  }
}

function addAmount(totals: Map<string, number>, participantId: string, amount: number) {
  totals.set(participantId, (totals.get(participantId) ?? 0) + amount);
}

function assertParticipants(participants: Participant[]) {
  const ids = new Set<string>();
  participants.forEach((participant) => {
    if (ids.has(participant.id)) {
      throw new SettlementCalculationError("참여자 ID가 중복돼요.");
    }
    ids.add(participant.id);
  });
  return ids;
}

function applyExpense(
  expense: Expense,
  participantIds: Set<string>,
  paidTotals: Map<string, number>,
  burdenTotals: Map<string, number>,
) {
  if (!participantIds.has(expense.payerId)) {
    throw new SettlementCalculationError("결제자를 찾을 수 없어요.");
  }
  if (expense.participantIds.length === 0) {
    throw new SettlementCalculationError("지출 참여자가 없어요.");
  }

  const selectedIds = new Set<string>();
  expense.participantIds.forEach((participantId) => {
    if (!participantIds.has(participantId)) {
      throw new SettlementCalculationError("지출 참여자를 찾을 수 없어요.");
    }
    if (selectedIds.has(participantId)) {
      throw new SettlementCalculationError("지출 참여자가 중복돼요.");
    }
    selectedIds.add(participantId);
  });

  const base = Math.floor(expense.amount / expense.participantIds.length);
  const remainder = expense.amount % expense.participantIds.length;
  addAmount(paidTotals, expense.payerId, expense.amount);
  expense.participantIds.forEach((participantId, index) => {
    addAmount(burdenTotals, participantId, base + (index < remainder ? 1 : 0));
  });
}

function buildTransfers(people: PersonSettlement[]): Transfer[] {
  const debtors = people
    .filter((person) => person.netBalance < 0)
    .map((person) => ({ id: person.participantId, remaining: -person.netBalance }));
  const creditors = people
    .filter((person) => person.netBalance > 0)
    .map((person) => ({ id: person.participantId, remaining: person.netBalance }));
  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (debtor.id !== creditor.id && amount > 0) {
      transfers.push({
        fromParticipantId: debtor.id,
        toParticipantId: creditor.id,
        amount,
      });
    }
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return transfers;
}

export function calculateSettlement(
  input: SettlementCalculationInput,
): SettlementResult {
  const participantIds = assertParticipants(input.participants);
  const paidTotals = new Map(input.participants.map(({ id }) => [id, 0]));
  const burdenTotals = new Map(input.participants.map(({ id }) => [id, 0]));

  input.expenses.forEach((expense) => {
    applyExpense(expense, participantIds, paidTotals, burdenTotals);
  });

  const people = input.participants.map(({ id }) => {
    const paidAmount = paidTotals.get(id) ?? 0;
    const burdenAmount = burdenTotals.get(id) ?? 0;
    return {
      participantId: id,
      paidAmount,
      burdenAmount,
      netBalance: paidAmount - burdenAmount,
    };
  });

  return {
    totalAmount: input.expenses.reduce((total, expense) => total + expense.amount, 0),
    people,
    transfers: buildTransfers(people),
  };
}
