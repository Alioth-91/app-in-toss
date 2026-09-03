type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="app-title">
        <p className="eyebrow">모임 비용을 한눈에</p>

        <h1 id="app-title">정산표</h1>

        <p className="welcome-copy">친구들과 쓴 돈을 간단하게 정리해요.</p>

        <button className="primary-button" type="button" onClick={onStart}>
          새 정산 시작
        </button>
      </section>
    </main>
  );
}
