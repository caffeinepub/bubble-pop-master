import { useEffect, useState } from "react";
import { useSoundManager } from "../hooks/useSound";

interface Props {
  level: number;
  score: number;
  stars: number;
  coins: number;
  onNext: () => void;
  onMenu: () => void;
  soundEnabled: boolean;
}

export default function LevelComplete({
  level,
  score,
  stars,
  coins,
  onNext,
  onMenu,
  soundEnabled,
}: Props) {
  const [shownStars, setShownStars] = useState(0);
  const { playWin } = useSoundManager(soundEnabled);

  useEffect(() => {
    playWin();
    const t1 = setTimeout(() => setShownStars(1), 400);
    const t2 = setTimeout(() => setShownStars(2), 700);
    const t3 = setTimeout(() => setShownStars(3), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [playWin]);

  return (
    <div
      data-ocid="levelcomplete.modal"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm"
    >
      <div className="game-frame rounded-3xl p-8 flex flex-col items-center gap-5 w-80">
        <div className="text-5xl animate-bounce">🎉</div>
        <h2 className="text-3xl font-black text-white text-glow-cyan">
          Level {level} Clear!
        </h2>

        {/* Stars */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="text-5xl"
              style={{
                opacity: shownStars >= i ? 1 : 0.2,
                transform: shownStars >= i ? "scale(1)" : "scale(0.5)",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                filter:
                  shownStars >= i && i <= stars
                    ? "drop-shadow(0 0 12px rgba(255,211,59,0.9))"
                    : "grayscale(1)",
              }}
            >
              {i <= stars ? "⭐" : "☆"}
            </span>
          ))}
        </div>

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
              Coins
            </div>
            <div className="text-2xl font-black text-yellow-300">
              +{coins} 🪙
            </div>
          </div>
        </div>

        <button
          type="button"
          data-ocid="levelcomplete.primary_button"
          onClick={onNext}
          className="btn-game btn-orange w-full text-xl"
        >
          Next Level ➡
        </button>
        <button
          type="button"
          data-ocid="levelcomplete.cancel_button"
          onClick={onMenu}
          className="btn-game w-full text-base"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          🏠 Menu
        </button>
      </div>
    </div>
  );
}
