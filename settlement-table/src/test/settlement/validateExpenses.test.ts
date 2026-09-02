import { describe, expect, it } from "vitest";
import type { Expense } from "../../features/settlement/settlement";
import { validateExpenses } from "../../features/settlement/validateExpenses";

const participantIds = new Set(["A", "B"]);
const expense: Expense = {
  id: "meal",
  description: "식사",
  amount: 10000,
  payerId: "A",
  participantIds: ["A", "B"],
};

describe("지출 검증", () => {
  it("유효한 지출을 허용한다", () => {
    expect(validateExpenses([expense], participantIds)).toEqual([]);
  });

  it.each([0, -1, 1.5])("유효하지 않은 금액 %s를 거부한다", (amount) => {
    const issues = validateExpenses([{ ...expense, amount }], participantIds);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "expenses.0.amount" }),
      ]),
    );
  });

  it("등록되지 않은 결제자와 참여자를 거부한다", () => {
    const issues = validateExpenses(
      [{ ...expense, payerId: "C", participantIds: ["A", "C"] }],
      participantIds,
    );
    expect(issues.map(({ path }) => path)).toEqual([
      "expenses.0.payerId",
      "expenses.0.participantIds.1",
    ]);
  });

  it("비어 있거나 중복된 지출 참여자 선택을 거부한다", () => {
    const empty = validateExpenses(
      [{ ...expense, participantIds: [] }],
      participantIds,
    );
    expect(empty).toEqual([
      expect.objectContaining({ path: "expenses.0.participantIds" }),
    ]);

    const duplicate = validateExpenses(
      [{ ...expense, participantIds: ["A", "A"] }],
      participantIds,
    );
    expect(duplicate).toEqual([
      expect.objectContaining({ path: "expenses.0.participantIds.1" }),
    ]);
  });

  it("비어 있는 지출 ID를 거부한다", () => {
    const issues = validateExpenses([{ ...expense, id: "" }], participantIds);
    expect(issues.map(({ path }) => path)).toEqual(["expenses.0.id"]);
  });

  it("중복된 지출 ID를 거부한다", () => {
    const issues = validateExpenses([expense, expense], participantIds);
    expect(issues.map(({ path }) => path)).toEqual(["expenses.1.id"]);
  });
});
