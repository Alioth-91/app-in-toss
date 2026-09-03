type HomeScreenProps = {
  onStart: () => void;
};

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <main className="home-screen" aria-labelledby="app-title">
      <div className="home-content">
        <header className="home-header">
          <h1 id="app-title">정산표</h1>
          <p>친구들과 쓴 돈을 간단하게 정리해요</p>
        </header>

        <section className="saved-settlements" aria-labelledby="saved-title">
          <div className="saved-settlements-heading">
            <h2 id="saved-title">저장한 정산</h2>
            <span>0 / 10</span>
          </div>
          <div className="empty-state-card">
            <div className="empty-state-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="empty-state-copy">
              <h3>아직 저장한 정산이 없어요</h3>
              <p>
                참여자와 지출만 입력하면
                <br />
                누가 누구에게 보낼지 계산해 드려요
              </p>
            </div>
          </div>
          <div className="example-settlement">
            <p>이렇게 정리돼요</p>
            <div>민수가 지수에게 12,000원을 보내세요</div>
          </div>
        </section>

        <p className="storage-notice">저장한 정산은 이 기기에만 보관돼요</p>
      </div>

      <div className="home-cta-bar">
        <button className="home-cta" type="button" onClick={onStart}>
          새 정산 시작
        </button>
      </div>
    </main>
  );
}
