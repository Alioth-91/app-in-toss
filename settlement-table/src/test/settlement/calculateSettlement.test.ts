import { describe, expect, it } from "vitest";

import {
  calculateSettlement,
  SettlementCalculationError,
} from "../../features/settlement/calculateSettlement";
import type { SettlementCalculationInput } from "../../features/settlement/calculateSettlement";

const participants = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

function input(expenses: SettlementCalculationInput["expenses"]): SettlementCalculationInput {
  return { participants, expenses };
}

describe("calculateSettlement", () => {
  it("splits a remainder in selected participant order", () => {
    const result = calculateSettlement(
      input([
        {
          id: "expense-a",
          description: "식사",
          amount: 100,
          payerId: "a",
          participantIds: ["a", "b", "c"],
        },
      ]),
    );

    expect(result.people).toEqual([
      { participantId: "a", paidAmount: 100, burdenAmount: 34, netBalance: 66 },
      { participantId: "b", paidAmount: 0, burdenAmount: 33, netBalance: -33 },
      { participantId: "c", paidAmount: 0, burdenAmount: 33, netBalance: -33 },
    ]);
    expect(result.transfers).toEqual([
      { fromParticipantId: "b", toParticipantId: "a", amount: 33 },
      { fromParticipantId: "c", toParticipantId: "a", amount: 33 },
    ]);
  });

  it("gives the one-won remainder to the first selected participant", () => {
    const result = calculateSettlement(
      input([
        {
          id: "expense-a",
          description: "간식",
          amount: 101,
          payerId: "a",
          participantIds: ["b", "c", "a"],
        },
      ]),
    );

    expect(result.people).toEqual([
      { participantId: "a", paidAmount: 101, burdenAmount: 33, netBalance: 68 },
      { participantId: "b", paidAmount: 0, burdenAmount: 34, netBalance: -34 },
      { participantId: "c", paidAmount: 0, burdenAmount: 34, netBalance: -34 },
    ]);
  });

  it("handles different participant subsets and payers", () => {
    const result = calculateSettlement(
      input([
        { id: "expense-a", description: "식사", amount: 90, payerId: "a", participantIds: ["a", "b"] },
        { id: "expense-b", description: "교통", amount: 90, payerId: "b", participantIds: ["b", "c"] },
      ]),
    );

    expect(result.totalAmount).toBe(180);
    expect(result.people).toEqual([
      { participantId: "a", paidAmount: 90, burdenAmount: 45, netBalance: 45 },
      { participantId: "b", paidAmount: 90, burdenAmount: 90, netBalance: 0 },
      { participantId: "c", paidAmount: 0, burdenAmount: 45, netBalance: -45 },
    ]);
    expect(result.transfers).toEqual([
      { fromParticipantId: "c", toParticipantId: "a", amount: 45 },
    ]);
  });

  it("preserves the balance invariants", () => {
    const result = calculateSettlement(
      input([
        { id: "expense-a", description: "숙소", amount: 101, payerId: "b", participantIds: ["c", "a", "b"] },
        { id: "expense-b", description: "간식", amount: 40, payerId: "c", participantIds: ["a", "c"] },
      ]),
    );

    expect(result.people.reduce((sum, person) => sum + person.netBalance, 0)).toBe(0);
    expect(result.people.reduce((sum, person) => sum + person.burdenAmount, 0)).toBe(141);
    expect(result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0)).toBe(
      result.people
        .filter((person) => person.netBalance < 0)
        .reduce((sum, person) => sum - person.netBalance, 0),
    );
    expect(result.transfers.every((transfer) => transfer.fromParticipantId !== transfer.toParticipantId)).toBe(true);

    expect(calculateSettlement(input([
      { id: "expense-a", description: "숙소", amount: 101, payerId: "b", participantIds: ["c", "a", "b"] },
      { id: "expense-b", description: "간식", amount: 40, payerId: "c", participantIds: ["a", "c"] },
    ]))).toEqual(result);
  });

  it("rejects unknown and duplicate calculation identities", () => {
    expect(() =>
      calculateSettlement(
        input([
          { id: "expense-a", description: "식사", amount: 10, payerId: "unknown", participantIds: ["a"] },
        ]),
      ),
    ).toThrowError(SettlementCalculationError);

    expect(() =>
      calculateSettlement({
        participants: [...participants, { id: "a", name: "A2" }],
        expenses: [],
      }),
    ).toThrowError(SettlementCalculationError);
  });
});
