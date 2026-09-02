import { useState } from "react";

import { ParticipantForm } from "./components/ParticipantForm";
import type { Participant } from "./features/settlement/settlement";

type AppScreen = "welcome" | "participants" | "participant-complete";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleComplete = (nextParticipants: Participant[]) => {
    setParticipants(nextParticipants);
    setScreen("participant-complete");
  };

  if (screen === "participant-complete") {
    return (
      <main className="app-shell">
        <section className="welcome-card" aria-labelledby="complete-title">
          <p className="eyebrow">참여자 입력 완료</p>
          <h1 id="complete-title">참여자를 확인했어요</h1>
          <p className="welcome-copy">총 {participants.length}명이에요.</p>
          <ul>
            {participants.map((participant) => (
              <li key={participant.id}>{participant.name}</li>
            ))}
          </ul>
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
