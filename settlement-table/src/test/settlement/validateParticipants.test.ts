import { describe, expect, it } from "vitest";
import { validateParticipants } from "../../features/settlement/validateParticipants";

const people = [
  { id: "A", name: "민수" },
  { id: "B", name: "지수" },
];

describe("참여자 검증", () => {
  it("참여자가 2명 또는 10명이면 허용한다", () => {
    expect(validateParticipants(people).issues).toEqual([]);

    const tenPeople = Array.from({ length: 10 }, (_, index) => ({
      id: `person-${index}`,
      name: `사람${index}`,
    }));
    expect(validateParticipants(tenPeople).issues).toEqual([]);
  });

  it("참여자가 허용 범위를 벗어나면 거부한다", () => {
    expect(validateParticipants([people[0]]).issues).toEqual([
      expect.objectContaining({ path: "participants" }),
    ]);
  });

  it("공백 이름과 공백 제거 후 중복 이름을 거부한다", () => {
    const issues = validateParticipants([
      { id: "A", name: " 민수 " },
      { id: "B", name: "민수" },
    ]).issues;
    expect(issues).toEqual([
      expect.objectContaining({ path: "participants.1.name" }),
    ]);
  });

  it("빈 ID와 중복 ID를 거부한다", () => {
    const issues = validateParticipants([
      { id: "", name: "민수" },
      { id: "A", name: "지수" },
      { id: "A", name: "철수" },
    ]).issues;
    expect(issues.map(({ path }) => path)).toEqual([
      "participants.0.id",
      "participants.2.id",
    ]);
  });
});
