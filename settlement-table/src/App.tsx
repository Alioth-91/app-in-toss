import { useState } from "react";

import { ParticipantForm } from "./components/ParticipantForm";
import { SettlementFormProvider } from "./components/SettlementFormProvider";
import type { Participant } from "./features/settlement/settlement";

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
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleComplete = (nextParticipants: Participant[]) => {
    setParticipants(nextParticipants);
    setScreen("expenses");
  };

  if (screen === "expenses") {
    return (
      <main className="app-shell">
        <section className="welcome-card" aria-labelledby="expense-title">
          <p className="eyebrow">참여자 입력 완료</p>
          <h1 id="expense-title">지출을 입력해 주세요</h1>
          <p className="welcome-copy">
            참여자 {participants.length}명이 준비됐어요. 이제 지출을 추가할 수
            있어요.
          </p>
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
