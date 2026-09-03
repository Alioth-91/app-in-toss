import { buildTransfers } from "./buildTransfers";
import type { Transfer } from "./buildTransfers";
import type { Expense, Participant, SettlementInput } from "./settlement";

export type SettlementCalculationInput = Pick<
  SettlementInput,
  "participants" | "expenses"
>;

export type PersonSettlement = {
  participantId: string;
  paidAmount: number;
  burdenAmount: number;
  netBalance: number;
};

export type SettlementResult = {
  totalAmount: number;
  people: PersonSettlement[];
  transfers: Transfer[];
};

export type { Transfer } from "./buildTransfers";

export class SettlementCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementCalculationError";
  }
}

function assertParticipantIds(participants: readonly Participant[]): Set<string> {
  const ids = new Set<string>();

  for (const participant of participants) {
    if (ids.has(participant.id)) {
      throw new SettlementCalculationError("참여자 ID가 중복돼요.");
    }
    ids.add(participant.id);
  }

  return ids;
}

function assertExpense(
  expense: Expense,
  participantIds: ReadonlySet<string>,
): void {
  if (!Number.isSafeInteger(expense.amount) || expense.amount <= 0) {
    throw new SettlementCalculationError("지출 금액이 올바르지 않아요.");
  }
  if (!participantIds.has(expense.payerId)) {
    throw new SettlementCalculationError("결제자를 찾을 수 없어요.");
  }
  if (expense.participantIds.length === 0) {
    throw new SettlementCalculationError("지출 참여자가 없어요.");
  }

  const selectedIds = new Set<string>();
  for (const participantId of expense.participantIds) {
    if (!participantIds.has(participantId)) {
      throw new SettlementCalculationError("지출 참여자를 찾을 수 없어요.");
    }
    if (selectedIds.has(participantId)) {
      throw new SettlementCalculationError("지출 참여자가 중복돼요.");
    }
    selectedIds.add(participantId);
  }
}

function addAmount(
  totals: Map<string, number>,
  participantId: string,
  amount: number,
): void {
  totals.set(participantId, (totals.get(participantId) ?? 0) + amount);
}

export function calculateSettlement(
  input: SettlementCalculationInput,
): SettlementResult {
  const participantIds = assertParticipantIds(input.participants);
  const paidTotals = new Map(input.participants.map(({ id }) => [id, 0]));
  const burdenTotals = new Map(input.participants.map(({ id }) => [id, 0]));
  let totalAmount = 0;

  for (const expense of input.expenses) {
    assertExpense(expense, participantIds);
    totalAmount += expense.amount;
    addAmount(paidTotals, expense.payerId, expense.amount);

    const base = Math.floor(expense.amount / expense.participantIds.length);
    const remainder = expense.amount % expense.participantIds.length;

    expense.participantIds.forEach((participantId, index) => {
      addAmount(
        burdenTotals,
        participantId,
        base + (index < remainder ? 1 : 0),
      );
    });
  }

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
    totalAmount,
    people,
    transfers: buildTransfers(people),
  };
}
