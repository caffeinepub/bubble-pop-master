interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  score: number;
  level: number;
}

export default function PauseOverlay({
  onResume,
  onRestart,
  onMenu,
  score,
  level,
}: Props) {
  return (
    <div
      data-ocid="pause.modal"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="game-frame rounded-3xl p-8 flex flex-col items-center gap-5 w-72">
        <h2 className="text-3xl font-black text-white">⏸ Paused</h2>
        <div className="text-white/70 text-sm">
          Level {level} &nbsp;|&nbsp; Score: {score.toLocaleString()}
        </div>

        <button
          type="button"
          data-ocid="pause.confirm_button"
          onClick={onResume}
          className="btn-game btn-orange w-full"
        >
          ▶ Resume
        </button>
        <button
          type="button"
          data-ocid="pause.secondary_button"
          onClick={onRestart}
          className="btn-game btn-purple w-full"
        >
          🔄 Restart Level
        </button>
        <button
          type="button"
          data-ocid="pause.cancel_button"
          onClick={onMenu}
          className="btn-game w-full"
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
