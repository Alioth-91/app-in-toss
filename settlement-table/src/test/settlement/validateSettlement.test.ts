import { describe, expect, it } from "vitest";
import type {
  Expense,
  SettlementInput,
} from "../../features/settlement/settlement";
import { validateSettlement } from "../../features/settlement/validateSettlement";

const people = [
  { id: "A", name: "민수" },
  { id: "B", name: "지수" },
];

const expense: Expense = {
  id: "meal",
  description: "식사",
  amount: 10000,
  payerId: "A",
  participantIds: ["A", "B"],
};

function makeInput(overrides: Partial<SettlementInput> = {}): SettlementInput {
  return {
    title: "여행",
    participants: people,
    expenses: [expense],
    ...overrides,
  };
}

describe("정산 입력 검증", () => {
  it("유효한 2인 정산을 허용한다", () => {
    expect(validateSettlement(makeInput())).toEqual([]);
  });

  it("지출이 없으면 오류를 반환한다", () => {
    const issues = validateSettlement(makeInput({ expenses: [] }));
    expect(issues).toEqual([expect.objectContaining({ path: "expenses" })]);
  });

  it("입력 데이터를 변경하지 않는다", () => {
    const input = makeInput();
    const snapshot = structuredClone(input);

    validateSettlement(input);

    expect(input).toEqual(snapshot);
  });
});
