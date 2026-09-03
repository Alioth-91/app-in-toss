import { ExpenseForm } from "../components/ExpenseForm";

export function ExpenseScreen() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="expense-title">
        <ExpenseForm />
      </section>
    </main>
  );
}
