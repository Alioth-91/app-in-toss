import { ParticipantForm } from "../components/ParticipantForm";

type SetupScreenProps = {
  onBack: () => void;
  onComplete: () => void;
};

export function SetupScreen({ onBack, onComplete }: SetupScreenProps) {
  return (
    <main className="setup-screen" aria-labelledby="participant-title">
      <header className="setup-progress">
        <button
          className="setup-back-button"
          type="button"
          aria-label="홈으로 돌아가기"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="setup-progress-content">
          <p>1 / 3 · 참여자</p>

          <div className="setup-progress-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <span className="setup-progress-spacer" aria-hidden="true" />
      </header>

      <section className="setup-content">
        <ParticipantForm onComplete={onComplete} />
      </section>
    </main>
  );
}
