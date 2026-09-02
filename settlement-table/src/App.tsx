import { useState } from "react";

import { ExpenseForm } from "./components/ExpenseForm";
import { ParticipantForm } from "./components/ParticipantForm";
import { SettlementFormProvider } from "./components/SettlementFormProvider";

type AppScreen = "welcome" | "participants" | "expenses";

export default function App() {
  return (
    <SettlementFormProvider>
      <AppContent />
    </SettlementFormProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<AppScreen>("welcome");

  const handleComplete = () => {
    setScreen("expenses");
  };

  if (screen === "expenses") {
    return (
      <main className="app-shell">
        <section className="welcome-card" aria-labelledby="expense-title">
          <ExpenseForm />
        </section>
      </main>
    );
  }

  if (screen === "participants") {
    return (
      <main className="app-shell">
        <section className="welcome-card" aria-labelledby="participant-title">
          <ParticipantForm onComplete={handleComplete} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="app-title">
        <p className="eyebrow">모임 비용을 한눈에</p>
        <h1 id="app-title">정산표</h1>
        <p className="welcome-copy">친구들과 쓴 돈을 간단하게 정리해요.</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setScreen("participants");
          }}
        >
          새 정산 시작
        </button>
      </section>
    </main>
  );
}
