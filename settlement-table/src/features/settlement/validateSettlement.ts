import type { SettlementInput, ValidationIssue } from "./settlement";
import { validateExpenses } from "./validateExpenses";
import { validateParticipants } from "./validateParticipants";

function addIssue(
  issues: ValidationIssue[],
  path: string,
  message: string,
): void {
  issues.push({ path, message });
}

/**
 * 정산 입력 전체를 검증하고 발견한 오류를 모아 반환하는 함수
 *
 * 참여자 검증과 지출 검증을 실행하며,
 * 지출이 없는 경우에도 오류를 추가한다.
 *
 * @param input 참여자와 지출을 포함한 정산 입력
 * @returns 정산 입력에서 발견한 검증 오류 목록
 */
export function validateSettlement(input: SettlementInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.expenses.length) {
    addIssue(issues, "expenses", "지출을 한 건 이상 입력해 주세요.");
  }

  const participantValidation = validateParticipants(input.participants);

  issues.push(...participantValidation.issues);

  issues.push(
    ...validateExpenses(input.expenses, participantValidation.participantIds),
  );

  return issues;
}
