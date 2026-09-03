import { ParticipantForm } from "../components/ParticipantForm";

type SetupScreenProps = {
  onComplete: () => void;
};

export function SetupScreen({ onComplete }: SetupScreenProps) {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="participant-title">
        <ParticipantForm onComplete={onComplete} />
      </section>
    </main>
  );
}
