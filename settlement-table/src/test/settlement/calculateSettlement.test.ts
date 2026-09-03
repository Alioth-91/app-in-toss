import { describe, expect, it } from "vitest";

import {
  buildTransfers,
  type SettlementBalance,
} from "../../features/settlement/buildTransfers";
import {
  calculateSettlement,
  SettlementCalculationError,
  type SettlementCalculationInput,
} from "../../features/settlement/calculateSettlement";

describe("buildTransfers", () => {
  it("보낼 사람과 받을 사람을 입력 순서대로 매칭한다", () => {
    const people: SettlementBalance[] = [
      { participantId: "a", netBalance: 70 },
      { participantId: "b", netBalance: -50 },
      { participantId: "c", netBalance: -50 },
      { participantId: "d", netBalance: 30 },
    ];

    expect(buildTransfers(people)).toEqual([
      { fromParticipantId: "b", toParticipantId: "a", amount: 50 },
      { fromParticipantId: "c", toParticipantId: "a", amount: 20 },
      { fromParticipantId: "c", toParticipantId: "d", amount: 30 },
    ]);
  });

  it("0원 잔액은 제외하고 송금이 없으면 빈 배열을 반환한다", () => {
    expect(
      buildTransfers([
        { participantId: "a", netBalance: 0 },
        { participantId: "b", netBalance: 0 },
      ]),
    ).toEqual([]);
  });

  it("같은 입력을 다시 계산해도 결과 순서가 같다", () => {
    const people: SettlementBalance[] = [
      { participantId: "a", netBalance: 60 },
      { participantId: "b", netBalance: -20 },
      { participantId: "c", netBalance: -40 },
    ];

    const first = buildTransfers(people);
    const second = buildTransfers(people);

    expect(second).toEqual(first);
    expect(people).toEqual([
      { participantId: "a", netBalance: 60 },
      { participantId: "b", netBalance: -20 },
      { participantId: "c", netBalance: -40 },
    ]);
  });
});

const participants = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

function input(
  expenses: SettlementCalculationInput["expenses"],
): SettlementCalculationInput {
  return { participants, expenses };
}

describe("calculateSettlement", () => {
  it("선택 순서대로 1원 나머지를 배분한다", () => {
    const result = calculateSettlement(
      input([
        {
          id: "meal",
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

  it("참여자 부분집합과 결제자가 다른 여러 지출을 합산한다", () => {
    const result = calculateSettlement(
      input([
        {
          id: "meal",
          description: "식사",
          amount: 90,
          payerId: "a",
          participantIds: ["a", "b"],
        },
        {
          id: "ride",
          description: "교통",
          amount: 90,
          payerId: "b",
          participantIds: ["b", "c"],
        },
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

  it("참여하지 않은 사람과 빈 지출 목록을 안전하게 처리한다", () => {
    const oneExpense = calculateSettlement(
      input([
        {
          id: "meal",
          description: "식사",
          amount: 100,
          payerId: "a",
          participantIds: ["a", "b"],
        },
      ]),
    );
    const empty = calculateSettlement(input([]));

    expect(oneExpense.people).toContainEqual({
      participantId: "c",
      paidAmount: 0,
      burdenAmount: 0,
      netBalance: 0,
    });
    expect(empty).toEqual({
      totalAmount: 0,
      people: [
        { participantId: "a", paidAmount: 0, burdenAmount: 0, netBalance: 0 },
        { participantId: "b", paidAmount: 0, burdenAmount: 0, netBalance: 0 },
        { participantId: "c", paidAmount: 0, burdenAmount: 0, netBalance: 0 },
      ],
      transfers: [],
    });
  });

  it("계산 합계 불변식을 유지하고 결과를 재현한다", () => {
    const expenses = [
      {
        id: "stay",
        description: "숙소",
        amount: 101,
        payerId: "b",
        participantIds: ["c", "a", "b"],
      },
      {
        id: "snack",
        description: "간식",
        amount: 40,
        payerId: "c",
        participantIds: ["a", "c"],
      },
    ];
    const result = calculateSettlement(input(expenses));

    expect(result.people.reduce((sum, person) => sum + person.netBalance, 0)).toBe(0);
    expect(result.people.reduce((sum, person) => sum + person.burdenAmount, 0)).toBe(141);
    expect(result.transfers.reduce((sum, transfer) => sum + transfer.amount, 0)).toBe(
      result.people
        .filter((person) => person.netBalance < 0)
        .reduce((sum, person) => sum - person.netBalance, 0),
    );
    expect(result.transfers.every((transfer) =>
      transfer.fromParticipantId !== transfer.toParticipantId,
    )).toBe(true);
    expect(calculateSettlement(input(expenses))).toEqual(result);
  });

  it("존재하지 않는 결제자 ID를 계산 오류로 중단한다", () => {
    expect(() => calculateSettlement(input([
      {
        id: "unknown-payer",
        description: "식사",
        amount: 10,
        payerId: "unknown",
        participantIds: ["a"],
      },
    ]))).toThrowError(SettlementCalculationError);
  });

  it("참여자 ID와 지출 참여자 참조 오류를 계산 오류로 중단한다", () => {
    expect(() => calculateSettlement({
      participants: [...participants, { id: "a", name: "A2" }],
      expenses: [],
    })).toThrowError(SettlementCalculationError);

    expect(() => calculateSettlement(input([{
      id: "unknown-user",
      description: "식사",
      amount: 10,
      payerId: "a",
      participantIds: ["unknown"],
    }]))).toThrowError(SettlementCalculationError);

    expect(() => calculateSettlement(input([{
      id: "duplicate-user",
      description: "식사",
      amount: 10,
      payerId: "a",
      participantIds: ["a", "a"],
    }]))).toThrowError(SettlementCalculationError);
  });

  it("계산에 필요한 산술 전제가 깨지면 계산 오류로 중단한다", () => {
    expect(() => calculateSettlement(input([{
      id: "invalid-amount",
      description: "식사",
      amount: 1.5,
      payerId: "a",
      participantIds: ["a"],
    }]))).toThrowError(SettlementCalculationError);

    expect(() => calculateSettlement(input([{
      id: "empty-users",
      description: "식사",
      amount: 10,
      payerId: "a",
      participantIds: [],
    }]))).toThrowError(SettlementCalculationError);
  });
});
