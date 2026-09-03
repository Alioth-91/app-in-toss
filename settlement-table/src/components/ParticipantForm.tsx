import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { createBlankParticipant } from "../features/settlement/createBlankParticipant";
import { validateParticipants } from "../features/settlement/validateParticipants";
import type { SettlementFormValues } from "./SettlementFormProvider";

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 10;

type ParticipantFormProps = {
  onComplete: () => void;
};

export function ParticipantForm({ onComplete }: ParticipantFormProps) {
  const [formError, setFormError] = useState("");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<SettlementFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "participants",
    keyName: "fieldKey",
  });

  const validateName = (index: number) => () => {
    const path = `participants.${index}.name`;
    const issue = validateParticipants(getValues("participants")).issues.find(
      (candidate) => candidate.path === path,
    );

    return issue?.message ?? true;
  };

  const submit = (values: SettlementFormValues) => {
    const meetingName = values.meetingName.trim();
    const participants = values.participants.map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }));
    const issues = validateParticipants(participants).issues;

    if (issues.length > 0) {
      setFormError(
        issues.find(({ path }) => path === "participants")?.message ??
          "입력 내용을 확인해 주세요.",
      );
      return;
    }

    setFormError("");
    setValue("meetingName", meetingName, { shouldValidate: false });
    setValue("participants", participants, { shouldValidate: false });
    onComplete();
  };

  const resetSetup = () => {
    clearErrors();
    setFormError("");
    setValue("meetingName", "", { shouldValidate: false });
    replace([
      createBlankParticipant(crypto.randomUUID()),
      createBlankParticipant(crypto.randomUUID()),
    ]);
    setIsResetConfirmOpen(false);
  };

  return (
    <form className="participant-form" onSubmit={handleSubmit(submit)}>
      <h1 id="participant-title">누구와 정산하나요?</h1>

      <div className="meeting-name-field">
        <div className="field-label">
          <label htmlFor="meeting-name">모임 이름</label>
          <span>선택</span>
        </div>
        <input
          id="meeting-name"
          placeholder="예: 제주도 여행"
          {...register("meetingName")}
        />
      </div>

      {formError ? (
        <p className="form-error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="participant-section">
        <div className="participant-heading">
          <div className="participant-heading-label">
            <span>참여자</span>
            <span>{fields.length} / 10명</span>
          </div>
          <button
            className="reset-button"
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            입력 내용 지우기
          </button>
        </div>

        <div className="participant-list">
          {fields.map((field, index) => {
            const fieldName = `participants.${index}.name` as const;
            const error = errors.participants?.[index]?.name;

            return (
              <div className="participant-row" key={field.fieldKey}>
                <span className="participant-number">{index + 1}</span>
                <div className={`participant-input ${error ? "has-error" : ""}`}>
                  <label className="visually-hidden" htmlFor={fieldName}>
                    참여자 {index + 1}
                  </label>
                  <input
                    id={fieldName}
                    placeholder="이름을 입력해 주세요"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${fieldName}-error` : undefined}
                    {...register(fieldName, { validate: validateName(index) })}
                  />
                  {error ? (
                    <p id={`${fieldName}-error`} className="field-error">
                      {error.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="participant-remove"
                  aria-label={`참여자 ${index + 1} 삭제`}
                  disabled={fields.length <= MIN_PARTICIPANTS}
                  onClick={() => {
                    setFormError("");
                    remove(index);
                  }}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            );
          })}
        </div>

        <button
          className="add-participant-button"
          type="button"
          disabled={fields.length >= MAX_PARTICIPANTS}
          onClick={() => {
            setFormError("");
            append(createBlankParticipant(crypto.randomUUID()));
          }}
        >
          ＋ 참여자 추가
        </button>
        <p className="participant-help">
          최소 2명, 최대 10명까지 정산할 수 있어요
        </p>
      </div>

      <button className="setup-next-button" type="submit">
        다음
      </button>

      {isResetConfirmOpen ? (
        <div className="reset-dialog-backdrop">
          <div
            className="reset-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            aria-describedby="reset-dialog-description"
          >
            <h2 id="reset-dialog-title">입력 내용을 지울까요?</h2>
            <p id="reset-dialog-description">
              모임 이름과 참여자 이름을 다시 입력해야 해요.
            </p>
            <div className="reset-dialog-actions">
              <button
                className="reset-cancel-button"
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                닫기
              </button>
              <button
                className="reset-confirm-button"
                type="button"
                onClick={resetSetup}
              >
                지우기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
