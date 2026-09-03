import { describe, expect, it } from "vitest";

import {
  buildTransfers,
  type SettlementBalance,
} from "../../features/settlement/buildTransfers";

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
