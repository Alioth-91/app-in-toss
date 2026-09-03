import { ExpenseForm } from "../components/ExpenseForm";

type ExpenseScreenProps = {
  onBack: () => void;
};

export function ExpenseScreen({ onBack }: ExpenseScreenProps) {
  return (
    <main className="expense-screen" aria-labelledby="expense-title">
      <header className="expense-progress">
        <button
          className="expense-back-button"
          type="button"
          aria-label="참여자 설정으로 돌아가기"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="expense-progress-content">
          <p>2 / 3 · 지출</p>
          <div className="expense-progress-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <span className="expense-progress-spacer" aria-hidden="true" />
      </header>

      <section className="expense-content">
        <ExpenseForm />
      </section>
    </main>
  );
}
