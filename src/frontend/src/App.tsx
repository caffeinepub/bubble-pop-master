import { useCallback, useState } from "react";
import GameScreen from "./components/GameScreen";
import MainMenu from "./components/MainMenu";
import SplashScreen from "./components/SplashScreen";
import type { AppScreen } from "./lib/bubbleTypes";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [level, setLevel] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number.parseInt(localStorage.getItem("bpm_high") ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  });

  const updateHighScore = useCallback(
    (s: number) => {
      if (s > highScore) {
        setHighScore(s);
        try {
          localStorage.setItem("bpm_high", String(s));
        } catch {
          /* ignore */
        }
      }
    },
    [highScore],
  );

  const handlePlay = () => {
    setLevel(0);
    setScreen("game");
  };

  const handleMenu = () => setScreen("menu");

  return (
    <div
      className="w-screen h-screen overflow-hidden font-nunito"
      style={{ background: "#070A12", maxWidth: "100vw", maxHeight: "100dvh" }}
    >
      {screen === "splash" && <SplashScreen onDone={() => setScreen("menu")} />}
      {screen === "menu" && (
        <MainMenu
          onPlay={handlePlay}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          highScore={highScore}
        />
      )}
      {screen === "game" && (
        <GameScreen
          level={level}
          soundEnabled={soundEnabled}
          highScore={highScore}
          onUpdateHighScore={updateHighScore}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}
