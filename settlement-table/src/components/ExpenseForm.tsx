import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { BottomSheet } from "@toss/tds-mobile";

import { createBlankExpenseDraft } from "../features/settlement/createBlankExpense";
import type { Expense } from "../features/settlement/settlement";
import { validateExpenses } from "../features/settlement/validateExpenses";
import type { SettlementFormValues } from "./SettlementFormProvider";

export function ExpenseForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    resetField,
    setError,
    setValue,
    formState: { errors },
  } = useFormContext<SettlementFormValues>();
  const meetingName = useWatch({ control, name: "meetingName" });
  const participants = useWatch({ control, name: "participants" });
  const expenses = useWatch({ control, name: "expenses" });
  const { append } = useFieldArray({ control, name: "expenses" });
  const initializedParticipantIds = useRef("");
  const participantIds = participants.map(({ id }) => id);

  useEffect(() => {
    const key = participantIds.join(",");
    if (!key || initializedParticipantIds.current === key) return;

    initializedParticipantIds.current = key;
    setValue("expenseDraft.participantIds", participantIds, {
      shouldValidate: false,
    });
  }, [participantIds, setValue]);

  const submit = (values: SettlementFormValues) => {
    clearErrors("expenseDraft");
    setFormError("");

    const expense: Expense = {
      ...values.expenseDraft,
      id: crypto.randomUUID(),
      description: values.expenseDraft.description.trim(),
    };
    const issues = validateExpenses([expense], new Set(participantIds));

    issues.forEach(({ path, message }) => {
      if (path.endsWith(".amount")) {
        setError("expenseDraft.amount", { type: "validate", message });
      }
      if (path.endsWith(".payerId")) {
        setError("expenseDraft.payerId", { type: "validate", message });
      }
      if (path.includes(".participantIds")) {
        setError("expenseDraft.participantIds", { type: "validate", message });
      }
    });

    if (issues.length > 0) {
      setFormError("입력 내용을 확인해 주세요.");
      return;
    }

    append(expense);
    resetField("expenseDraft", {
      defaultValue: createBlankExpenseDraft(participantIds),
    });
    setIsAdding(false);
  };

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const participantError = errors.expenseDraft?.participantIds;
  const openAddForm = () => {
    setFormError("");
    setIsAdding(true);
  };
  const closeAddForm = () => {
    clearErrors("expenseDraft");
    setFormError("");
    setIsAdding(false);
  };

  return (
    <div className="expense-stage">
      <section className="expense-summary-card" aria-labelledby="expense-title">
        <div className="expense-summary-heading">
          <h1 id="expense-title">{meetingName || "새 정산"}</h1>
          <span>참여자 {participants.length}명</span>
        </div>
        <div className="expense-summary-total">
          <div>
            <span>전체 지출액</span>
            <strong>{total.toLocaleString()}원</strong>
          </div>
          {expenses.length > 0 ? <span>지출 {expenses.length}건</span> : null}
        </div>
      </section>

      {expenses.length > 0 ? (
        <>
          <ul className="expense-list" aria-label="지출 목록">
            {expenses.map((expense) => (
              <li key={expense.id} className="expense-item">
                <span>{expense.description || "내용 없음"}</span>
                <strong>{expense.amount.toLocaleString()}원</strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {isAdding ? (
        <BottomSheet
          open={isAdding}
          onClose={closeAddForm}
          hasTextField
          maxHeight="90vh"
          expandedMaxHeight="95vh"
          expandBottomSheet
          ctaContentGap={80}
          header={
            <BottomSheet.Header>
              <div className="expense-sheet-header">
                <span>지출 추가</span>
                <button
                  className="expense-sheet-close"
                  type="button"
                  aria-label="지출 추가 닫기"
                  onClick={closeAddForm}
                >
                  ×
                </button>
              </div>
            </BottomSheet.Header>
          }
          cta={
            <BottomSheet.CTA type="submit" form="expense-form">
              저장
            </BottomSheet.CTA>
          }
        >
          <form
            id="expense-form"
            className="expense-sheet-form"
            onSubmit={handleSubmit(submit)}
          >
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}

            <label htmlFor="expense-amount">금액 *</label>
            <input
              id="expense-amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              aria-invalid={Boolean(errors.expenseDraft?.amount)}
              {...register("expenseDraft.amount", { valueAsNumber: true })}
            />
            {errors.expenseDraft?.amount ? (
              <p className="field-error">
                {errors.expenseDraft.amount.message}
              </p>
            ) : null}

            <label htmlFor="expense-description">지출 내용 (선택)</label>
            <input
              id="expense-description"
              placeholder="예: 흑돼지 저녁"
              {...register("expenseDraft.description")}
            />

            <label htmlFor="expense-payer">결제자</label>
            <select
              id="expense-payer"
              aria-invalid={Boolean(errors.expenseDraft?.payerId)}
              {...register("expenseDraft.payerId")}
            >
              <option value="">결제자를 선택해 주세요</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
            {errors.expenseDraft?.payerId ? (
              <p className="field-error">
                {errors.expenseDraft.payerId.message}
              </p>
            ) : null}

            <fieldset>
              <legend>함께한 참여자</legend>
              {participants.map((participant) => (
                <label key={participant.id}>
                  <input
                    type="checkbox"
                    value={participant.id}
                    {...register("expenseDraft.participantIds")}
                  />
                  {participant.name}
                </label>
              ))}
            </fieldset>
            {participantError ? (
              <p className="field-error">{participantError.message}</p>
            ) : null}
          </form>
        </BottomSheet>
      ) : expenses.length === 0 ? (
        <section className="expense-empty-state" aria-live="polite">
          <div className="expense-empty-icon" aria-hidden="true">
            ＋
          </div>
          <div className="expense-empty-copy">
            <h2>아직 입력한 지출이 없어요</h2>
            <p>
              누가 얼마를 결제했는지 한 건씩 추가하면
              <br />
              정산 결과를 계산할 수 있어요
            </p>
          </div>
          <button
            className="expense-empty-cta"
            type="button"
            onClick={openAddForm}
          >
            첫 지출 추가하기
          </button>
        </section>
      ) : null}

      {!isAdding ? (
        <div className="expense-cta-bar">
          <button
            className="expense-add-cta"
            type="button"
            onClick={openAddForm}
          >
            지출 추가
          </button>
          <button
            className="expense-result-cta"
            type="button"
            disabled={expenses.length === 0}
          >
            정산 결과 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
