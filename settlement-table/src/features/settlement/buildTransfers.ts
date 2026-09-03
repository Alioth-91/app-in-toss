export type SettlementBalance = {
  participantId: string;
  netBalance: number;
};

export type Transfer = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
};

type RemainingBalance = {
  participantId: string;
  remaining: number;
};

export function buildTransfers(
  people: readonly SettlementBalance[],
): Transfer[] {
  // 돈을 보내야 하는 사람들
  const debtors: RemainingBalance[] = people
    .filter(({ netBalance }) => netBalance < 0)
    .map(({ participantId, netBalance }) => ({
      participantId,
      remaining: -netBalance,
    }));

  // 돈을 받아야 하는 사람들
  const creditors: RemainingBalance[] = people
    .filter(({ netBalance }) => netBalance > 0)
    .map(({ participantId, netBalance }) => ({
      participantId,
      remaining: netBalance,
    }));

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (debtor.participantId !== creditor.participantId && amount > 0) {
      transfers.push({
        fromParticipantId: debtor.participantId,
        toParticipantId: creditor.participantId,
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
