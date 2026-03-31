interface Props {
  score: number;
  highScore: number;
  level: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOver({
  score,
  highScore,
  level,
  onRestart,
  onMenu,
}: Props) {
  const isNewHigh = score >= highScore && score > 0;

  return (
    <div
      data-ocid="gameover.modal"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="game-frame rounded-3xl p-8 flex flex-col items-center gap-5 w-80">
        <div className="text-5xl">💔</div>
        <h2 className="text-3xl font-black text-white">Game Over</h2>
        <p className="text-white/60 text-sm">Reached Level {level}</p>

        {isNewHigh && (
          <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-2xl px-6 py-3 text-center">
            <div className="text-yellow-300 font-black text-lg">
              🏆 New High Score!
            </div>
          </div>
        )}

        <div className="flex gap-6 text-center">
          <div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wide">
              Score
            </div>
            <div className="text-2xl font-black text-yellow-300">
              {score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-wide">
              Best
            </div>
            <div className="text-2xl font-black text-yellow-300">
              {highScore.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          type="button"
          data-ocid="gameover.primary_button"
          onClick={onRestart}
          className="btn-game btn-orange w-full text-xl"
        >
          🔄 Try Again
        </button>
        <button
          type="button"
          data-ocid="gameover.cancel_button"
          onClick={onMenu}
          className="btn-game w-full text-base"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
}
