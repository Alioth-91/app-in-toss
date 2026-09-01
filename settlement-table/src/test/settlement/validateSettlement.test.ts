import { describe, expect, it } from "vitest";

import {
  resolveSettlementTitle,
  type SettlementInput,
} from "../../features/settlement/settlement";
import { validateSettlement } from "../../features/settlement/validateSettlement";

const validInput: SettlementInput = {
  title: "",
  participants: [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ],
  expenses: [
    {
      id: "expense-a",
      description: "식사",
      amount: 1000,
      payerId: "a",
      participantIds: ["a", "b"],
    },
  ],
};

describe("validateSettlement", () => {
  it("accepts a valid settlement without mutating it", () => {
    const before = structuredClone(validInput);

    expect(validateSettlement(validInput)).toEqual([]);
    expect(validInput).toEqual(before);
  });

  it("rejects participant and expense limits", () => {
    const issues = validateSettlement({
      ...validInput,
      participants: [{ id: "a", name: "A" }],
      expenses: [],
    });

    expect(issues.map((issue) => issue.path)).toEqual([
      "participants",
      "expenses",
    ]);

    const tooManyParticipants = validateSettlement({
      ...validInput,
      participants: Array.from({ length: 11 }, (_, index) => ({
        id: `participant-${index}`,
        name: `Person ${index}`,
      })),
    });

    expect(tooManyParticipants.map((issue) => issue.path)).toContain("participants");
  });

  it.each([0, -1, 10.5])("rejects amount %s", (amount) => {
    const issues = validateSettlement({
      ...validInput,
      expenses: [{ ...validInput.expenses[0], amount }],
    });

    expect(issues.map((issue) => issue.path)).toContain("expenses.0.amount");
  });

  it("rejects duplicate names, invalid amounts, and unknown people", () => {
    const issues = validateSettlement({
      ...validInput,
      participants: [
        { id: "a", name: " A " },
        { id: "b", name: "A" },
      ],
      expenses: [
        {
          ...validInput.expenses[0],
          amount: 10.5,
          payerId: "unknown",
          participantIds: ["a", "unknown", "a"],
        },
      ],
    });

    expect(issues.map((issue) => issue.path)).toEqual([
      "participants.1.name",
      "expenses.0.amount",
      "expenses.0.payerId",
      "expenses.0.participantIds.1",
      "expenses.0.participantIds.2",
    ]);
  });
});

describe("resolveSettlementTitle", () => {
  it("trims a supplied title and defaults to the current date", () => {
    const date = new Date("2026-09-01T12:00:00+09:00");

    expect(resolveSettlementTitle("  여행  ", date)).toBe("여행");
    expect(resolveSettlementTitle("", date)).toBe("2026.09.01");
  });
});
