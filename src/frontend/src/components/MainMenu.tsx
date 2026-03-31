import { useEffect, useRef, useState } from "react";
import { useSoundManager } from "../hooks/useSound";

interface Props {
  onPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highScore: number;
}

interface FloatingBubble {
  x: number;
  y: number;
  r: number;
  color: string;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
}

export default function MainMenu({
  onPlay,
  soundEnabled,
  onToggleSound,
  highScore,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [showHow, setShowHow] = useState(false);
  const { startBgm, stopBgm } = useSoundManager(soundEnabled);

  useEffect(() => {
    if (soundEnabled) startBgm();
    return () => stopBgm();
  }, [soundEnabled, startBgm, stopBgm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "#FF3B3B",
      "#FFD43B",
      "#3DFF7A",
      "#3BA7FF",
      "#B04BFF",
      "#FF8A3D",
    ];
    const bubbles: FloatingBubble[] = [];
    for (let i = 0; i < 18; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 12 + Math.random() * 24,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#FF3B3B",
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    let running = true;
    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of bubbles) {
        b.phase += b.phaseSpeed;
        b.x += b.vx + Math.sin(b.phase) * 0.3;
        b.y += b.vy;
        if (b.y < -b.r * 2) {
          b.y = canvas.height + b.r;
          b.x = Math.random() * canvas.width;
        }
        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.3,
          b.y - b.r * 0.3,
          b.r * 0.1,
          b.x,
          b.y,
          b.r,
        );
        grad.addColorStop(0, `${b.color}CC`);
        grad.addColorStop(0.7, `${b.color}88`);
        grad.addColorStop(1, `${b.color}33`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          b.x - b.r * 0.25,
          b.y - b.r * 0.3,
          b.r * 0.3,
          b.r * 0.18,
          -Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #1B0F3A 0%, #0B0F1F 50%, #070A12 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(124,77,255,0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-5 w-full px-8"
        style={{ maxWidth: 360 }}
      >
        <div className="flex flex-col items-center mb-2">
          <span
            className="text-6xl mb-1"
            style={{ filter: "drop-shadow(0 0 16px rgba(95,227,255,0.9))" }}
          >
            🫧
          </span>
          <h1
            className="text-4xl font-black text-center leading-tight"
            style={{
              background:
                "linear-gradient(135deg, #FF7A3C 0%, #FFD43B 40%, #3DFF7A 70%, #3BA7FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 8px rgba(255,122,60,0.4))",
            }}
          >
            Bubble Pop
          </h1>
          <h2 className="text-3xl font-black text-white text-glow-cyan tracking-widest">
            MASTER
          </h2>
        </div>

        {highScore > 0 && (
          <div className="text-yellow-300 text-sm font-bold">
            🏆 Best: {highScore.toLocaleString()}
          </div>
        )}

        <button
          type="button"
          data-ocid="menu.primary_button"
          onClick={onPlay}
          className="btn-game btn-orange w-full text-2xl py-5 font-black"
        >
          🎮 PLAY
        </button>

        <button
          type="button"
          data-ocid="menu.secondary_button"
          onClick={() => setShowHow(true)}
          className="btn-game btn-purple w-full text-lg"
        >
          📖 How to Play
        </button>

        <button
          type="button"
          data-ocid="menu.toggle"
          onClick={onToggleSound}
          className="btn-game btn-cyan w-full text-lg"
        >
          {soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF"}
        </button>
      </div>

      {showHow && (
        <div
          data-ocid="howto.modal"
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          role="presentation"
          onClick={() => setShowHow(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowHow(false);
          }}
        >
          <div
            className="game-frame rounded-3xl p-6 max-w-xs w-full"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-white mb-4 text-center">
              How to Play
            </h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li>
                🎯 <strong>Aim</strong> — drag/tap above the cannon
              </li>
              <li>
                🫧 <strong>Match 3+</strong> same-color bubbles to pop them
              </li>
              <li>
                💥 <strong>Bomb</strong> — explodes nearby bubbles
              </li>
              <li>
                🌈 <strong>Rainbow</strong> — matches any color
              </li>
              <li>
                ❄️ <strong>Ice</strong> — needs 2 hits to break
              </li>
              <li>
                🔥 <strong>Fire</strong> — destroys row below it
              </li>
              <li>
                ⭐ <strong>Combos</strong> earn bonus points!
              </li>
            </ul>
            <button
              type="button"
              data-ocid="howto.close_button"
              onClick={() => setShowHow(false)}
              className="btn-game btn-orange w-full mt-5"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 text-white/30 text-xs">
        © {new Date().getFullYear()} Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
