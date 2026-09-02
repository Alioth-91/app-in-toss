import type { Participant, ValidationIssue } from "./settlement";

export type ParticipantValidationResult = {
  participantIds: ReadonlySet<string>;
  issues: ValidationIssue[];
};

/**
 * 참여자 검증 에러 메시지를 리스트로 반환
 *
 * @param issues 검증 오류를 누적할 목록
 * @param path 오류가 발생한 입력 필드 경로
 * @param message 사용자에게 보여줄 오류 메시지
 */
function addIssue(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path, message });
}

/**
 * 참여자 검증 함수
 *
 * @param participants 검증할 참여자 리스트
 * @returns 참여자 ID 집합과 검증 오류 목록
 */
export function validateParticipants(
  participants: readonly Participant[],
): ParticipantValidationResult {
  const issues: ValidationIssue[] = [];
  const participantIds = new Set<string>();
  const participantNames = new Set<string>();

  if (participants.length < 2 || participants.length > 10) {
    addIssue(
      issues,
      "participants",
      "참여자는 2명 이상 10명 이하로 입력해 주세요.",
    );
  }

  participants.forEach((participant, index) => {
    const basePath = `participants.${index}`;
    const id = participant.id.trim();
    const name = participant.name.trim();

    if (!id) {
      addIssue(issues, `${basePath}.id`, "참여자 ID가 필요해요.");
    } else if (participantIds.has(id)) {
      addIssue(issues, `${basePath}.id`, "참여자 ID가 중복되었어요.");
    } else {
      participantIds.add(id);
    }

    if (!name) {
      addIssue(issues, `${basePath}.name`, "참여자 이름을 입력해 주세요.");
    } else if (participantNames.has(name)) {
      addIssue(
        issues,
        `${basePath}.name`,
        "같은 이름을 중복해서 사용할 수 없어요.",
      );
    } else {
      participantNames.add(name);
    }
  });

  return { participantIds, issues };
}
