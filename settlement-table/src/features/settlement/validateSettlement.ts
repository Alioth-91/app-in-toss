import type {
  SettlementInput,
  ValidationIssue,
} from "./settlement";

function addIssue(
  issues: ValidationIssue[],
  path: string,
  message: string,
) {
  issues.push({ path, message });
}

export function validateSettlement(
  input: SettlementInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (input.participants.length < 2 || input.participants.length > 10) {
    addIssue(issues, "participants", "참여자는 2명 이상 10명 이하로 입력해 주세요.");
  }

  const participantIds = new Set<string>();
  const participantNames = new Set<string>();

  input.participants.forEach((participant, index) => {
    const idPath = `participants.${index}.id`;
    const namePath = `participants.${index}.name`;
    const normalizedName = participant.name.trim();

    if (participant.id.trim().length === 0) {
      addIssue(issues, idPath, "참여자 ID가 필요해요.");
    } else if (participantIds.has(participant.id)) {
      addIssue(issues, idPath, "참여자 ID가 중복돼요.");
    } else {
      participantIds.add(participant.id);
    }

    if (normalizedName.length === 0) {
      addIssue(issues, namePath, "참여자 이름을 입력해 주세요.");
    } else if (participantNames.has(normalizedName)) {
      addIssue(issues, namePath, "같은 정산 안에서는 이름을 중복할 수 없어요.");
    } else {
      participantNames.add(normalizedName);
    }
  });

  if (input.expenses.length === 0) {
    addIssue(issues, "expenses", "지출을 한 건 이상 추가해 주세요.");
  }

  const expenseIds = new Set<string>();
  input.expenses.forEach((expense, expenseIndex) => {
    const basePath = `expenses.${expenseIndex}`;

    if (expense.id.trim().length === 0) {
      addIssue(issues, `${basePath}.id`, "지출 ID가 필요해요.");
    } else if (expenseIds.has(expense.id)) {
      addIssue(issues, `${basePath}.id`, "지출 ID가 중복돼요.");
    } else {
      expenseIds.add(expense.id);
    }

    if (!Number.isSafeInteger(expense.amount) || expense.amount <= 0) {
      addIssue(issues, `${basePath}.amount`, "금액은 1원 이상의 정수여야 해요.");
    }

    if (!participantIds.has(expense.payerId)) {
      addIssue(issues, `${basePath}.payerId`, "결제자는 참여자 중에서 선택해 주세요.");
    }

    if (expense.participantIds.length === 0) {
      addIssue(issues, `${basePath}.participantIds`, "참여자를 한 명 이상 선택해 주세요.");
    }

    const selectedIds = new Set<string>();
    expense.participantIds.forEach((participantId, participantIndex) => {
      const participantPath = `${basePath}.participantIds.${participantIndex}`;
      if (!participantIds.has(participantId)) {
        addIssue(issues, participantPath, "등록된 참여자만 선택할 수 있어요.");
      }
      if (selectedIds.has(participantId)) {
        addIssue(issues, participantPath, "같은 참여자를 중복 선택할 수 없어요.");
      }
      selectedIds.add(participantId);
    });
  });

  return issues;
}
