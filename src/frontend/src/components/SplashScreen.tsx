import { useEffect, useRef, useState } from "react";
import { useSoundManager } from "../hooks/useSound";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState(0); // 0=entering 1=title 2=subtitle 3=done
  const { playIntro } = useSoundManager(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Trigger animations
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const t4 = setTimeout(() => onDone(), 2600);
    setTimeout(() => playIntro(), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone, playIntro]);

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {
      x: number;
      y: number;
      r: number;
      color: string;
      vx: number;
      vy: number;
    }[] = [];
    const colors = [
      "#FF3B3B",
      "#FFD43B",
      "#3DFF7A",
      "#3BA7FF",
      "#B04BFF",
      "#FF8A3D",
    ];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 4 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.5,
      });
    }

    let running = true;
    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}88`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #1B0F3A 0%, #0B0F1F 60%, #070A12 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(124,77,255,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,61,166,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(23,182,255,0.2) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Bubbles emoji cluster */}
        <div
          className="text-6xl mb-2 transition-all duration-700"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform:
              phase >= 1
                ? "scale(1) translateY(0)"
                : "scale(0.5) translateY(20px)",
            filter: "drop-shadow(0 0 20px rgba(95,227,255,0.8))",
          }}
        >
          🫧
        </div>

        {/* Title */}
        <h1
          className="text-5xl font-black text-center leading-tight"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform:
              phase >= 1
                ? "scale(1) translateY(0)"
                : "scale(0.8) translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            background:
              "linear-gradient(135deg, #FF7A3C, #FFD43B, #3DFF7A, #3BA7FF, #B04BFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 20px rgba(255,122,60,0.5))",
          }}
        >
          Bubble Pop
        </h1>

        <h2
          className="text-4xl font-black text-white text-glow-cyan tracking-widest"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(15px)",
            transition: "all 0.5s ease-out",
            letterSpacing: "0.2em",
          }}
        >
          MASTER
        </h2>

        <div
          className="mt-6 text-white/50 text-sm"
          style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.5s" }}
        >
          Loading...
        </div>
      </div>
    </div>
  );
}
