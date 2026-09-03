# 정산표 계산 모듈 복구 설계

- 작업명: 정산 계산 기준선 복구
- 대상 앱: `settlement-table`
- 상태: 채팅 설계 승인 완료, 문서 검토 대기
- 관련 과거 기준: `e272465` 계산 구현, `f76f613` 계산 테스트

## 1. 배경과 목표

현재 `settlement-table`에는 참여자·지출 입력과 입력 검증은 있지만,
결과 화면과 저장·공유 기능이 사용할 `calculateSettlement` 모듈은 현재
브랜치에서 빠져 있다. 같은 기능의 과거 구현과 테스트는 저장소의 이전
커밋에 남아 있다.

이번 작업은 과거 동작을 무비판적으로 복사하는 것이 아니라, 현재의
`Participant`, `Expense`, `SettlementInput` 타입과 MVP 정책에 맞춰 계산
기준선을 복구하는 것이다.

목표는 다음과 같다.

- 원화 정수 금액을 선택된 참여자끼리 균등 분할한다.
- 사람별 지불액·부담액·순수 잔액을 계산한다.
- 최종 잔액만으로 이해 가능한 송금 목록을 만든다.
- 같은 입력에 항상 같은 결과를 반환한다.
- 화면·React·앱인토스 SDK와 독립된 순수 TypeScript 모듈을 제공한다.
- 이후 결과·공유·저장 기능이 안정된 계산 계약을 사용하게 한다.

## 2. 범위

### 포함

- `calculateSettlement` 공개 함수와 결과 타입
- 참여자 ID와 지출 참여자 참조의 방어적 검사
- 지출별 균등 분할과 원 단위 나머지 배분
- 사람별 집계와 최종 송금 목록 생성
- 계산 결과의 합계 불변식 테스트
- 과거 계산 테스트의 현재 타입·정책 기준 복구

### 제외

- React 화면과 결과 화면
- React Hook Form 연동
- 로컬 저장소와 저장 정책
- 공유 텍스트 포매터
- 앱인토스 SDK와 광고
- 비율·금액 직접 분할, 여러 통화, 환율
- 수학적으로 가능한 최소 송금 횟수를 찾는 최적화

## 3. 책임 분리

입력 검증과 계산은 서로 다른 책임으로 둔다.

```text
[사용자 입력]
      |
      v
[validateSettlement]
      |
      +-- 검증 실패 --> ValidationIssue[] --> [필드/폼 오류]
      |
      v
[calculateSettlement]
      |
      +-- 저장 데이터 구조 손상 --> SettlementCalculationError
      |
      v
[SettlementResult]
```

`validateSettlement`는 사용자에게 보여줄 오류의 경로와 메시지를
만든다. 빈 이름, 중복 이름, 잘못된 금액, 지출 없음처럼 입력 흐름에서
수정해야 하는 오류는 기존 검증 모듈이 담당한다.

`calculateSettlement`는 정상 입력을 계산한다. 다만 계산 대상과
참여자의 연결이 깨진 경우에는 결과를 추측하지 않는다. 참여자 ID 중복,
존재하지 않는 결제자 ID, 존재하지 않는 지출 참여자 ID, 지출 안의 중복
참여자 ID처럼 집계 대상을 잘못 매핑할 수 있는 데이터는
`SettlementCalculationError`로 중단한다.

계산에 필요한 산술 전제도 방어한다. 지출 금액이 유한한 양의 정수가
아니거나 지출 참여자가 비어 있으면 계산 오류로 처리한다. 정상적인
사용자 입력에서는 `validateExpenses`가 먼저 같은 조건을 알려주므로,
이 방어 검사는 저장 데이터나 호출 누락으로 인한 조용한 오계산을
막는 역할을 한다.

## 4. 계산 계약

계산 함수는 정산 제목이나 화면 상태를 알 필요가 없으므로 참여자와
지출만 받는다.

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

type Transfer = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
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

결과의 `people`는 지출에 참여하지 않은 사람도 포함해 입력된 참여자
순서를 유지한다. 그런 사람의 지불액·부담액·순수 잔액은 0이며,
송금 목록에는 포함하지 않는다. 이름 대신 ID를 반환하는 이유는 이름이
나중에 수정될 수 있어 계산 결과가 특정 표시 문자열에 묶이지 않도록
하기 위해서다.

## 5. 정산 규칙

### 5.1 지출별 균등 분할

각 지출은 선택된 참여자 수로 나눈다.

```text
base = floor(amount / selectedParticipantCount)
remainder = amount % selectedParticipantCount
```

선택된 참여자 배열의 앞에서부터 `remainder`명에게 1원씩 더한다.
예를 들어 100원을 `[A, B, C]`가 사용하면 부담액은
`A=34원, B=33원, C=33원`이다. 선택 순서가 `[B, C, A]`라면
`B=34원, C=33원, A=33원`이다.

이 규칙은 모든 금액을 정수로 유지하고, 부담액 합계를 원래 지출액과
일치시키며, 재계산 결과를 결정적으로 만든다.

### 5.2 사람별 집계

각 참여자에 대해 모든 지출을 합산한다.

```text
paidAmount   = 해당 참여자가 결제한 지출의 합
burdenAmount = 해당 참여자가 부담한 분할 금액의 합
netBalance   = paidAmount - burdenAmount
```

- `netBalance > 0`: 받을 금액
- `netBalance < 0`: 보낼 금액
- `netBalance === 0`: 송금 없음

### 5.3 송금 목록

송금 목록은 개별 지출이 아니라 최종 `netBalance`를 기준으로 만든다.

1. 음수 잔액을 가진 사람을 입력 참여자 순서로 보낸 사람 목록에 넣는다.
2. 양수 잔액을 가진 사람을 입력 참여자 순서로 받을 사람 목록에 넣는다.
3. 현재 보낼 금액과 받을 금액 중 작은 금액을 하나의 송금으로 만든다.
4. 한쪽 금액이 0이 되면 다음 사람으로 이동한다.
5. 모든 보낼 사람과 받을 사람이 처리될 때까지 반복한다.

예를 들어 A가 30,000원을 A·B·C를 위해 결제했다면 결과는 다음과
같다.

```text
A: +20,000원
B: -10,000원
C: -10,000원

B → A 10,000원
C → A 10,000원
```

이 방식은 모든 잔액을 맞추면서 결과 순서를 고정한다. MVP는 가능한
모든 송금 조합 중 수학적으로 가장 적은 횟수를 보장하지 않는다.

## 6. 모듈 경계

현재 `src/features/settlement/settlement.ts`의 입력 타입은 유지한다.
계산 결과 타입과 계산 오류는 계산 공개 API에 가까이 두어 현재 과거
호출 계약을 보존한다.

```text
src/features/settlement/
  settlement.ts              입력·저장에 쓰는 도메인 타입
  calculateSettlement.ts     공개 계산 함수와 결과 타입
  buildTransfers.ts           잔액 기반 송금 생성 순수 함수
  validateSettlement.ts       전체 입력 검증
  validateExpenses.ts         지출 검증
  validateParticipants.ts     참여자 검증
```

`calculateSettlement.ts`는 다음 흐름만 조합한다.

```text
참여자 ID 검사
      ↓
지출별 paid/burden 누적
      ↓
입력 참여자 순서대로 people 생성
      ↓
buildTransfers(people)
      ↓
SettlementResult 반환
```

`buildTransfers.ts`는 `PersonSettlement[]`만 받아 송금 목록을 반환하는
순수 함수로 둔다. React, 폼, 저장소, 날짜, 난수, SDK를 참조하지 않는다.
이 경계를 두면 송금 정책을 별도 테스트하고 나중에 공유 포매터가
계산 결과를 안정적으로 소비할 수 있다.

## 7. 빈 지출과 오류 처리

계산 함수에 지출 배열이 비어 있으면 다음 결과를 반환한다.

- `totalAmount: 0`
- 모든 참여자의 `paidAmount`, `burdenAmount`, `netBalance`: 0
- `transfers: []`

지출이 없는 정산을 완료하는 것은 허용하지 않는다. 이 완료 가능 여부는
`validateSettlement`가 `expenses` 경로의 검증 오류로 처리한다. 계산 함수가
빈 상태를 표현할 수 있게 하면 결과 화면의 빈 상태나 향후 미리보기에서
불필요한 예외 처리를 피할 수 있다.

계산 오류는 사용자 입력 폼에 직접 표시하지 않는다. 화면 흐름에서는
먼저 `validateSettlement`를 실행하고, 저장된 원본을 다시 계산할 때
`SettlementCalculationError`를 오류 상태로 전환한다. 오류 메시지는
개인정보나 원문 입력을 포함하지 않는다.

## 8. 테스트 설계

테스트는 `src/test/settlement/calculateSettlement.test.ts`에 모은다.
개인정보 없는 고정 ID와 짧은 설명만 사용한다.

필수 사례는 다음과 같다.

1. 100원을 3명이 나눌 때 앞선 선택자에게 1원이 배분된다.
2. 선택 순서가 바뀌면 나머지 배분도 그 순서를 따른다.
3. 여러 지출에서 결제자와 참여자 부분집합이 다르게 동작한다.
4. 참여하지 않은 사람도 `people`에 0원으로 남는다.
5. 모든 `netBalance`의 합이 0이다.
6. 모든 부담액의 합이 전체 지출액과 같다.
7. 송금액 합계가 음수 잔액 합계와 같다.
8. 자기 자신에게 송금하는 항목이 없다.
9. 같은 입력을 두 번 계산하면 결과가 같다.
10. 참여자 ID 중복, 알 수 없는 결제자, 알 수 없는 참여자,
    지출 참여자 중복을 오류로 처리한다.
11. 빈 지출 목록은 0원 결과를 반환한다.
12. 양의 정수가 아닌 금액과 참여자가 없는 지출은 계산 오류가 된다.

검증 명령은 앱 디렉터리에서 각각 실행한다.

```bash
npm run test
npm run lint
npm run build
```

구현 단위마다 관련 테스트와 `git diff --check`를 실행하고, 계산 복구
작업이 끝난 뒤 세 명령을 모두 실행한다. 계산 모듈은 화면과 분리된
순수 코드이므로 브라우저나 앱인토스 실기기 확인은 이 작업의 완료
조건이 아니다.

## 9. 구현 단위와 완료 조건

### 단위 A — 집계 계산

- 대상: `calculateSettlement.ts`, 계산 타입, 계산 집계 테스트
- 책임: ID 방어 검사, 지출별 분할, paid/burden/net 집계, total 계산
- 주요 코드: 약 50~100줄
- 성공 조건: 사람별 집계와 합계 불변식 테스트 통과

### 단위 B — 송금 생성

- 대상: `buildTransfers.ts`, 송금 테스트 보강
- 책임: 음수·양수 잔액의 결정적 매칭
- 주요 코드: 약 50줄 이하
- 성공 조건: 송금 목록 합계·순서·자기 송금 금지 테스트 통과

단위 A와 B는 각각 독립적으로 검증하고 별도 승인을 받는다. 한 단위의
구현이 100줄을 넘을 것으로 보이면 그 지점에서 멈추고 책임을 더 나눈다.

### 작업 전체 완료 조건

- `calculateSettlement`가 현재 정산 타입과 호환된다.
- 계산 결과에 React·SDK·저장소 의존성이 없다.
- 과거 테스트의 핵심 동작과 현재 MVP 규칙이 모두 검증된다.
- 계산·송금 합계 불변식이 테스트로 고정된다.
- `npm run test`, `npm run lint`, `npm run build`가 통과한다.
- 기존 사용자의 `settlement-table/PLAN.md` 변경은 그대로 보존된다.

## 10. 설계상 결정하지 않는 것

이번 모듈은 이름 표시, 공유 문장, 저장 시점, 광고 이용 여부를 결정하지
않는다. 해당 정책은 각각 결과 화면·공유 어댑터·저장소·광고 브리지
설계에서 계산 결과를 입력으로 받아 결정한다.
