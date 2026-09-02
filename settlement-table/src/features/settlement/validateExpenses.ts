import type { Expense, ValidationIssue } from "./settlement";

function addIssue(
  issues: ValidationIssue[],
  path: string,
  message: string,
): void {
  issues.push({ path, message });
}

/**
 * 정산에 사용할 지출 목록의 유효성을 검증하는 함수
 *
 * 지출 식별자와 금액을 확인하고, 결제자와 분담 참여자가
 * 등록된 참여자인지 및 중복 없이 한 명 이상 선택되었는지 검사한다.
 *
 * @param expenses 검증할 지출 목록(검증 함수에서 임의로 수정을 금지)
 * @param participantIds 유효한 참여자 ID 집합()
 * @returns 지출에서 발견한 검증 오류 목록
 */
export function validateExpenses(
  expenses: readonly Expense[],
  participantIds: ReadonlySet<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expenseIds = new Set<string>();

  expenses.forEach((expense, index) => {
    const basePath = `expenses.${index}`;
    if (!expense.id.trim()) {
      addIssue(issues, `${basePath}.id`, "지출 ID가 필요해요.");
    } else if (expenseIds.has(expense.id)) {
      addIssue(issues, `${basePath}.id`, "지출 ID가 중복되었어요.");
    } else {
      expenseIds.add(expense.id);
    }

    if (!Number.isSafeInteger(expense.amount) || expense.amount <= 0) {
      addIssue(
        issues,
        `${basePath}.amount`,
        "금액은 1원 이상의 정수여야 해요.",
      );
    }
    if (!participantIds.has(expense.payerId)) {
      addIssue(
        issues,
        `${basePath}.payerId`,
        "결제자는 참여자 중에서 선택해 주세요.",
      );
    }
    if (expense.participantIds.length === 0) {
      addIssue(
        issues,
        `${basePath}.participantIds`,
        "참여자를 한 명 이상 선택해 주세요.",
      );
    }

    const selectedIds = new Set<string>();

    expense.participantIds.forEach((participantId, participantIndex) => {
      const participantPath = `${basePath}.participantIds.${participantIndex}`;

      if (!participantIds.has(participantId)) {
        addIssue(issues, participantPath, "등록된 참여자만 선택할 수 있어요.");
      }
      if (selectedIds.has(participantId)) {
        addIssue(
          issues,
          participantPath,
          "같은 참여자를 중복 선택할 수 없어요.",
        );
      }
      selectedIds.add(participantId);
    });
  });

  return issues;
}
