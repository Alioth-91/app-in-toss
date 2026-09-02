import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import type { Participant } from "../features/settlement/settlement";
import { validateParticipants } from "../features/settlement/validateParticipants";

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 10;

type ParticipantFormValues = {
  participants: Participant[];
};

type ParticipantFormProps = {
  onComplete: (participants: Participant[]) => void;
};

function createBlankParticipant(): Participant {
  return { id: crypto.randomUUID(), name: "" };
}

export function ParticipantForm({ onComplete }: ParticipantFormProps) {
  const [formError, setFormError] = useState("");
  const {
    control,
    getValues,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ParticipantFormValues>({
    defaultValues: {
      participants: [createBlankParticipant(), createBlankParticipant()],
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({
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

  const submit = (values: ParticipantFormValues) => {
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
    onComplete(participants);
  };

  return (
    <form className="participant-form" onSubmit={handleSubmit(submit)}>
      <h1 id="participant-title">참여자 입력</h1>

      <p className="welcome-copy">
        참여자는 2명 이상 10명 이하로 입력해 주세요.
      </p>

      {formError ? (
        <p className="form-error" role="alert">
          {formError}
        </p>
      ) : null}

      {fields.map((field, index) => {
        const fieldName = `participants.${index}.name` as const;
        const error = errors.participants?.[index]?.name;

        return (
          <div className="participant-row" key={field.fieldKey}>
            <label htmlFor={fieldName}>참여자 {index + 1}</label>

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

            <button
              type="button"
              className="secondary-button"
              disabled={fields.length <= MIN_PARTICIPANTS}
              onClick={() => {
                setFormError("");
                remove(index);
              }}
            >
              삭제
            </button>
          </div>
        );
      })}

      <button
        className="primary-button"
        type="button"
        disabled={fields.length >= MAX_PARTICIPANTS}
        onClick={() => {
          setFormError("");
          append(createBlankParticipant());
        }}
      >
        참여자 추가
      </button>

      <button className="primary-button" type="submit">
        다음
      </button>
    </form>
  );
}
