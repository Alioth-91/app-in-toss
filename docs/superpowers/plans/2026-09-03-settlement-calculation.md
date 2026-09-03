# 정산 계산 모듈 복구 Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with the repository's approval gates and a review after each task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 브랜치에서 빠진 정산 계산 기준선을 복구해, 참여자별 집계와 결정적인 최종 송금 목록을 순수 TypeScript로 제공한다.

**Architecture:** `calculateSettlement`는 사용자 입력 검증과 분리된 순수 계산 진입점으로 둔다. 계산 파일은 참여자·지출을 검증 가능한 내부 구조로 집계하고, 송금 생성은 `buildTransfers`라는 별도 순수 함수에 위임한다. 화면·React Hook Form·로컬 저장소·앱인토스 SDK는 이 구현에 의존하지 않는다.

**Tech Stack:** React 18.3.1, TypeScript 6.0.3, Vitest 4.1.9, Vite 8.2.2, npm

**Spec:** `docs/superpowers/specs/2026-09-03-settlement-calculation-design.md`

## Global Constraints

- 구현 대상 앱은 `settlement-table`이며 모든 명령은 해당 디렉터리에서 실행한다.
- 참여자는 2~10명, 통화는 원화, 각 지출은 선택된 참여자끼리 균등 분할한다.
- 금액은 `Number.isSafeInteger(amount) && amount > 0`인 원 단위 정수만 계산한다.
- 나머지 원은 선택된 참여자 배열의 앞에서부터 1원씩 배분한다.
- `validateSettlement`는 사용자에게 보여줄 입력 오류를 담당하고, 계산 함수는 구조·참조·산술 전제를 방어한다.
- `calculateSettlement`는 같은 입력에 같은 결과를 반환하며 React·SDK·저장소를 import하지 않는다.
- 앱인토스 SDK를 추가하거나 화면 컴포넌트를 수정하지 않는다.
- 테스트 파일은 `settlement-table/src/test/` 아래에만 둔다.
- 한 승인 단위의 주요 애플리케이션 코드는 약 50~100줄을 기준으로 한다. 초과 예상 시 해당 지점에서 멈추고 단위를 다시 나눈다.
- 각 단위는 별도 승인 후 구현하고, 관련 테스트·lint·`git diff --check`를 통과한 뒤 커밋한다.
- 개인정보·원문 입력·비공개 키를 코드, fixture, 로그, 커밋 메시지에 기록하지 않는다.
- 사용자가 수정 중인 `settlement-table/PLAN.md`는 staging과 커밋 대상에서 제외한다.

## File Map

| 파일 | 상태 | 책임 |
| --- | --- | --- |
| `settlement-table/src/features/settlement/buildTransfers.ts` | 생성 | 최종 잔액을 결정적인 송금 목록으로 변환 |
| `settlement-table/src/features/settlement/calculateSettlement.ts` | 생성 | 참여자·지출을 검증하고 전체 정산 결과를 계산 |
| `settlement-table/src/test/settlement/calculateSettlement.test.ts` | 생성·수정 | 송금 생성과 전체 계산의 순수 함수 테스트 |
| `settlement-table/src/features/settlement/settlement.ts` | 변경 없음 | 현재 입력·저장 타입 유지 |
| `settlement-table/src/features/settlement/validateSettlement.ts` | 변경 없음 | 사용자 입력 오류 검증 유지 |

`buildTransfers`는 먼저 독립적으로 검증할 수 있게 만든다. 이 함수는
전체 사람 정보가 아니라 `participantId`와 `netBalance`만 읽으므로 계산
집계와 송금 정책의 결합을 줄인다. 최종 공개 결과의 `Transfer` 타입은
`calculateSettlement.ts`에서 재-export해 호출자가 계산 진입점만 알아도
되게 한다.

```text
SettlementInput
      |
      v
calculateSettlement
      |
      +-- participant IDs / expense references 검사
      +-- paidAmount, burdenAmount 누적
      +-- people 생성
      +-- buildTransfers(people)
      |
      v
SettlementResult
```

## Task 1: 결정적인 송금 생성 함수

**Files:**

- Create: `settlement-table/src/features/settlement/buildTransfers.ts`
- Create: `settlement-table/src/test/settlement/calculateSettlement.test.ts`

**Interfaces:**

- Consumes: `readonly SettlementBalance[]`
- Produces: `buildTransfers(people): Transfer[]`

```ts
export type SettlementBalance = {
  participantId: string;
  netBalance: number;
};

export type Transfer = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
};

export function buildTransfers(
  people: readonly SettlementBalance[],
): Transfer[];
```

- [ ] **Step 1: 송금 매칭의 실패 테스트를 작성한다**

`settlement-table/src/test/settlement/calculateSettlement.test.ts`에 다음
테스트를 작성한다. 아직 `buildTransfers.ts`를 만들지 않았으므로 이
단계에서는 모듈 import 실패가 예상된다.

```ts
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm run test -- src/test/settlement/calculateSettlement.test.ts`

Expected: `../../features/settlement/buildTransfers` 모듈을 찾을 수 없어
실패한다.

- [ ] **Step 3: 최소 송금 생성 함수를 구현한다**

`buildTransfers.ts`에 다음 알고리즘을 구현한다.

```ts
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
  const debtors: RemainingBalance[] = people
    .filter(({ netBalance }) => netBalance < 0)
    .map(({ participantId, netBalance }) => ({
      participantId,
      remaining: -netBalance,
    }));
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
```

입력 배열을 직접 수정하지 않도록 잔액은 `RemainingBalance` 복사본에
보관한다. 양수·음수 잔액만 각각의 목록에 넣고, 두 목록 모두 입력
순서를 유지한다.

- [ ] **Step 4: 송금 테스트를 통과시키고 정적 검사를 실행한다**

Run: `npm run test -- src/test/settlement/calculateSettlement.test.ts`

Expected: `buildTransfers` 관련 3개 테스트가 PASS한다.

Run: `npm run lint`

Expected: ESLint 오류가 없다.

Run: `git diff --check`

Expected: 공백·패치 형식 오류가 없다.

- [ ] **Step 5: Task 1을 커밋한다**

```bash
git add settlement-table/src/features/settlement/buildTransfers.ts \
  settlement-table/src/test/settlement/calculateSettlement.test.ts
git commit -m "feat: add deterministic settlement transfers"
```

성공 조건: 송금 생성 파일의 주요 코드는 50줄 안팎이고, 입력 잔액을
변경하지 않으며, 결정적인 송금 테스트가 통과한다. 여기서 구현을
멈추고 별도 승인을 받은 뒤 Task 2로 이동한다.

## Task 2: 정산 집계와 공개 계산 API 복구

**Files:**

- Create: `settlement-table/src/features/settlement/calculateSettlement.ts`
- Modify: `settlement-table/src/test/settlement/calculateSettlement.test.ts`

**Interfaces:**

- Consumes: `Participant`, `Expense`, `SettlementInput` from `settlement.ts`; `buildTransfers` from Task 1
- Produces: `calculateSettlement(input): SettlementResult`, `SettlementCalculationError`, `PersonSettlement`, `Transfer`

```ts
type SettlementCalculationInput = Pick<
  SettlementInput,
  "participants" | "expenses"
>;

type PersonSettlement = {
  participantId: string;
  paidAmount: number;
  burdenAmount: number;
  netBalance: number;
};

type SettlementResult = {
  totalAmount: number;
  people: PersonSettlement[];
  transfers: Transfer[];
};

function calculateSettlement(
  input: SettlementCalculationInput,
): SettlementResult;
```

- [ ] **Step 1: 계산 결과의 실패 테스트를 추가한다**

기존 `calculateSettlement.test.ts`의 `buildTransfers` 테스트 아래에 다음
계산용 import와 fixture를 추가한다.

```ts
import {
  calculateSettlement,
  SettlementCalculationError,
  type SettlementCalculationInput,
} from "../../features/settlement/calculateSettlement";

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
```

다음 사례를 테스트한다. 각 테스트는 ID와 짧은 설명만 사용한다.

```ts
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

  it("참여자와 지출의 구조적 참조 오류를 계산 오류로 중단한다", () => {
    expect(() => calculateSettlement({
      participants: [...participants, { id: "a", name: "A2" }],
      expenses: [],
    })).toThrowError(SettlementCalculationError);

    expect(() => calculateSettlement(input([{
      id: "unknown-payer",
      description: "식사",
      amount: 10,
      payerId: "unknown",
      participantIds: ["a"],
    }]))).toThrowError(SettlementCalculationError);

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
```

- [ ] **Step 2: 계산 테스트가 구현 부재로 실패하는지 확인한다**

Run: `npm run test -- src/test/settlement/calculateSettlement.test.ts`

Expected: 새 `calculateSettlement` import 때문에 모듈을 찾을 수 없어
테스트 파일 수집 단계에서 실패한다. Task 1의 테스트 코드는 그대로
유지되며, Task 2 구현 후 같은 명령으로 전체 테스트를 다시 실행한다.

- [ ] **Step 3: 계산 공개 API를 구현한다**

`calculateSettlement.ts`에 다음 책임을 순서대로 구현한다.

1. `SettlementCalculationInput`, `PersonSettlement`, `SettlementResult`를 export한다.
2. `buildTransfers`의 `Transfer` 타입을 재-export한다.
3. `SettlementCalculationError extends Error`를 만들고 `name`을 고정한다.
4. 참여자 ID를 `Set`에 넣으며 중복을 발견하면 중단한다.
5. 모든 참여자의 `paidTotals`와 `burdenTotals`을 0으로 초기화한다.
6. 각 지출의 금액·결제자·참여자 참조를 검사한다.
7. `base`와 `remainder`를 계산하고 선택 순서대로 부담액을 누적한다.
8. 입력 참여자 순서대로 `people`을 만들고 `netBalance`를 계산한다.
9. 전체 금액과 `buildTransfers(people)`를 넣어 결과를 반환한다.

구현의 핵심 형태는 다음과 같다.

```ts
import {
  buildTransfers,
  type Transfer,
} from "./buildTransfers";
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

export { type Transfer } from "./buildTransfers";

export class SettlementCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementCalculationError";
  }
}

function addAmount(
  totals: Map<string, number>,
  participantId: string,
  amount: number,
): void {
  totals.set(
    participantId,
    (totals.get(participantId) ?? 0) + amount,
  );
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
      addAmount(burdenTotals, participantId, base + (index < remainder ? 1 : 0));
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
```

`calculateSettlement`는 `input.expenses`가 비어 있으면 초기화된 0원
결과를 반환한다. 지출 없음으로 정산을 완료할 수 있는지는 기존
`validateSettlement`가 계속 결정하므로 이 파일에 사용자 흐름 정책을
추가하지 않는다.

- [ ] **Step 4: 계산 테스트와 기존 검증 테스트를 통과시킨다**

Run: `npm run test -- src/test/settlement/calculateSettlement.test.ts`

Expected: 송금 테스트 3개와 계산 테스트 6개가 PASS한다.

Run: `npm run test`

Expected: 계산 테스트와 기존 참여자·지출·전체 검증 테스트가 모두 PASS한다.

Run: `npm run lint`

Expected: ESLint 오류가 없다. 줄바꿈이나 formatter 차이로 오류가 나면
기존 저장소 스타일에 맞춰 해당 파일만 조정한다.

Run: `git diff --check`

Expected: 공백·패치 형식 오류가 없다.

- [ ] **Step 5: Task 2를 커밋한다**

```bash
git add settlement-table/src/features/settlement/calculateSettlement.ts \
  settlement-table/src/test/settlement/calculateSettlement.test.ts
git commit -m "feat: restore settlement calculation"
```

성공 조건: 현재 `settlement.ts` 타입과 호환되는 공개 계산 함수가 생기고,
나머지 배분·부분 참여·빈 지출·오류·합계 불변식이 테스트로 고정된다.
계산 파일의 주요 애플리케이션 코드는 100줄을 넘지 않도록 유지한다.

## Task 3: 계산 기준선 전체 검증과 인수 체크

**Files:**

- Modify: 없음
- Test: 기존 Task 1·2 테스트와 전체 앱 검증 명령

**Interfaces:**

- Consumes: Task 1의 `buildTransfers`, Task 2의 `calculateSettlement`
- Produces: 계산 모듈 복구 완료 판정과 다음 화면 작업의 안정된 계산 계약

- [ ] **Step 1: 변경 범위를 확인한다**

Run: `git status --short --branch`

Expected: `settlement-table/PLAN.md`의 기존 사용자 변경은 남아 있고,
계산 모듈 파일과 테스트만 이번 작업의 변경으로 보인다. `App.tsx`,
폼 컴포넌트, SDK 설정 파일은 변경하지 않는다.

Run: `git diff --stat 847750c..HEAD`

Expected: 설계 커밋 이후 Task 1·2의 계산 파일과 테스트 변경만
포함된다. 사용자가 수정 중인 `settlement-table/PLAN.md`는 이 비교에
포함되지 않아야 한다.

- [ ] **Step 2: 앱 전체 자동 검증을 실행한다**

앱 디렉터리에서 다음 명령을 각각 실행한다.

```bash
npm run test
npm run lint
npm run build
```

Expected: 세 명령이 모두 성공한다. `vite` 번들 크기 경고가 있으면
실패로 간주하지 않고 출력 내용을 완료 보고에 기록한다.

- [ ] **Step 3: 완료 조건을 대조한다**

다음 항목을 하나씩 확인한다.

- 결과 타입은 이름이 아니라 `participantId`를 반환한다.
- 지출별 부담액 합계가 각 지출 금액과 일치한다.
- 전체 부담액과 전체 지출액이 일치한다.
- 모든 순수 잔액의 합이 0이다.
- 송금 목록은 최종 잔액만 사용하고 자기 자신에게 보내지 않는다.
- 같은 입력을 다시 계산해도 결과가 같다.
- 잘못된 참여자 참조와 계산 전제 오류가 조용히 무시되지 않는다.
- 계산 모듈에 React, SDK, 저장소 의존성이 없다.
- 브라우저·앱인토스 실기기 검증은 이 작업의 완료 조건에 포함하지 않고, 결과 화면 작업에서 별도로 진행한다.

## Implementation Handoff

계획에 정의된 구현 단위는 Task 1 송금 생성과 Task 2 전체 계산으로
나뉘며, 각각 구현 전 별도 승인이 필요하다. Task 3은 두 단위가 끝난
뒤 실행하는 통합 검증이다.

계획 완료 후 실행 방식은 다음 중 하나를 선택한다.

1. **단위별 분리 실행(권장):** Task 1을 구현·검토·커밋한 뒤 멈추고, 승인을 받아 Task 2를 진행한다.
2. **이 세션에서 순차 실행:** 각 Task의 승인·검증 체크포인트를 지키면서 같은 세션에서 진행한다.
