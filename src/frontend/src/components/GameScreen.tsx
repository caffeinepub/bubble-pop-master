import { useCallback, useEffect, useRef, useState } from "react";
import { useSoundManager } from "../hooks/useSound";
import type {
  BubbleColor,
  BubbleSpecial,
  FallingBubble,
  FloatingScore,
  GridCell,
  Particle,
  TravelingBubble,
} from "../lib/bubbleTypes";
import { BUBBLE_DARK, BUBBLE_FILL, BUBBLE_HIGHLIGHT } from "../lib/bubbleTypes";
import { LEVELS, parseChar } from "../lib/levels";
import GameOver from "./GameOver";
import LevelComplete from "./LevelComplete";
import PauseOverlay from "./PauseOverlay";

// ─── Constants ───────────────────────────────────────────────────────────────
const CW = 360;
const CH = 640;
const BR = 16; // bubble radius
const BD = BR * 2; // bubble diameter
const CE = 9; // columns even rows
const CO = 8; // columns odd rows
const RH = Math.round(BD * 0.866); // row height ~28
const GT = 80; // grid top y (center of row 0)
const SX = CW / 2; // shooter x
const SY = CH - 70; // shooter y
const BSPEED = 700; // bubble travel speed px/s

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cellPx(row: number, col: number): { x: number; y: number } {
  return {
    x: BR + col * BD + (row % 2 === 1 ? BR : 0),
    y: GT + row * RH,
  };
}

function maxCols(row: number) {
  return row % 2 === 0 ? CE : CO;
}

function getNeighbors(r: number, c: number): { r: number; c: number }[] {
  const odd = r % 2 === 1;
  return [
    { r, c: c - 1 },
    { r, c: c + 1 },
    { r: r - 1, c: odd ? c : c - 1 },
    { r: r - 1, c: odd ? c + 1 : c },
    { r: r + 1, c: odd ? c : c - 1 },
    { r: r + 1, c: odd ? c + 1 : c },
  ];
}

function validCell(r: number, c: number) {
  return r >= 0 && r < 20 && c >= 0 && c < maxCols(r);
}

function randomBubble(levelIdx: number): {
  color: BubbleColor;
  special: BubbleSpecial;
} {
  const colors: BubbleColor[] = ["red", "yellow", "green", "blue"];
  if (levelIdx >= 3) colors.push("purple");
  if (levelIdx >= 4) colors.push("orange");
  const color = colors[Math.floor(Math.random() * colors.length)];
  let special: BubbleSpecial = "normal";
  const r = Math.random();
  if (levelIdx >= 2 && r < 0.05) special = "bomb";
  else if (levelIdx >= 3 && r < 0.1) special = "rainbow";
  else if (levelIdx >= 1 && r < 0.15) special = "ice";
  return { color, special };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: BubbleColor,
  special: BubbleSpecial,
  iceHits = 0,
  alpha = 1,
  t = 0,
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  if (special === "rainbow") {
    // Cycling hue gradient
    const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    const hue = (t * 120) % 360;
    grad.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
    grad.addColorStop(0.33, `hsl(${(hue + 120) % 360}, 100%, 60%)`);
    grad.addColorStop(0.66, `hsl(${(hue + 240) % 360}, 100%, 60%)`);
    grad.addColorStop(1, `hsl(${hue}, 100%, 60%)`);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  } else if (special === "bomb") {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    // Orange glow ring
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,120,0,${0.6 + 0.3 * Math.sin(t * 8)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Explosion star
    ctx.fillStyle = "#FF8A3D";
    ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💥", x, y);
  } else if (special === "ice") {
    const iceColor =
      iceHits > 0 ? "rgba(160,210,255,0.85)" : "rgba(200,235,255,0.92)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = iceColor;
    ctx.fill();
    // Crack pattern if hit
    if (iceHits > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.6);
      ctx.lineTo(x, y);
      ctx.lineTo(x + r * 0.4, y - r * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - r * 0.5, y + r * 0.4);
      ctx.stroke();
    }
    ctx.font = `${Math.round(r * 0.8)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❄", x, y + 1);
  } else if (special === "fire") {
    const fgrad = ctx.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r);
    fgrad.addColorStop(0, "#FFF44F");
    fgrad.addColorStop(0.4, "#FF6B00");
    fgrad.addColorStop(1, "#CC0000");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fgrad;
    ctx.fill();
    ctx.font = `${Math.round(r * 0.85)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔥", x, y);
  } else {
    // Normal bubble
    const fill = BUBBLE_FILL[color];
    const bgrad = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.35,
      r * 0.05,
      x,
      y,
      r,
    );
    bgrad.addColorStop(0, BUBBLE_HIGHLIGHT[color]);
    bgrad.addColorStop(0.5, fill);
    bgrad.addColorStop(1, BUBBLE_DARK[color]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = bgrad;
    ctx.fill();
  }

  // Gloss highlight (all bubbles except bomb)
  if (special !== "bomb") {
    ctx.beginPath();
    ctx.ellipse(
      x - r * 0.22,
      y - r * 0.3,
      r * 0.28,
      r * 0.16,
      -0.6,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fill();
  }

  // Outline
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawShooter(
  ctx: CanvasRenderingContext2D,
  angle: number,
  currBubble: { color: BubbleColor; special: BubbleSpecial },
  t: number,
) {
  ctx.save();
  ctx.translate(SX, SY);

  // Base plate
  const bgrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
  bgrad.addColorStop(0, "#4a5080");
  bgrad.addColorStop(1, "#1a2040");
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fillStyle = bgrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(95,227,255,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Barrel
  ctx.save();
  ctx.rotate(angle - Math.PI / 2);
  const brl = ctx.createLinearGradient(-8, 0, 8, 0);
  brl.addColorStop(0, "#334");
  brl.addColorStop(0.4, "#778");
  brl.addColorStop(1, "#334");
  ctx.fillStyle = brl;
  ctx.beginPath();
  ctx.roundRect(-7, -44, 14, 44, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Current bubble in cannon
  drawBubble(ctx, 0, 0, BR - 2, currBubble.color, currBubble.special, 0, 1, t);
  ctx.restore();
}

function drawAimLine(ctx: CanvasRenderingContext2D, angle: number) {
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let x = SX;
  let y = SY;
  let dx = Math.cos(angle);
  let dy = Math.sin(angle);
  ctx.moveTo(x, y);
  for (let i = 0; i < 300; i++) {
    x += dx * 4;
    y += dy * 4;
    if (x < BR) {
      x = BR;
      dx = Math.abs(dx);
    }
    if (x > CW - BR) {
      x = CW - BR;
      dx = -Math.abs(dx);
    }
    if (y < GT) break;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  level: number;
  soundEnabled: boolean;
  highScore: number;
  onUpdateHighScore: (s: number) => void;
  onMenu: () => void;
}

type GameStatus = "playing" | "paused" | "levelcomplete" | "gameover";

export default function GameScreen({
  level,
  soundEnabled,
  highScore,
  onUpdateHighScore,
  onMenu,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ── React state (for HUD & overlays) ──
  const [uiScore, setUiScore] = useState(0);
  const [uiShots, setUiShots] = useState(0);
  const [uiLevel, setUiLevel] = useState(level);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [stars, setStars] = useState(1);
  const [coins, setCoins] = useState(10);

  // ── Internal game refs (never trigger renders) ──
  const gridRef = useRef<(GridCell | null)[][]>([]);
  const travelRef = useRef<TravelingBubble | null>(null);
  const fallingRef = useRef<FallingBubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatScoresRef = useRef<FloatingScore[]>([]);
  const currentBubRef = useRef<{ color: BubbleColor; special: BubbleSpecial }>({
    color: "blue",
    special: "normal",
  });
  const nextBubRef = useRef<{ color: BubbleColor; special: BubbleSpecial }>({
    color: "green",
    special: "normal",
  });
  const aimAngleRef = useRef(-Math.PI / 2);
  const isAimingRef = useRef(false);
  const scoreRef = useRef(0);
  const shotsRef = useRef(25);
  const levelRef = useRef(level);
  const statusRef = useRef<GameStatus>("playing");
  const timeRef = useRef(0);
  const bgParticlesRef = useRef<
    { x: number; y: number; r: number; alpha: number; speed: number }[]
  >([]);

  const sounds = useSoundManager(soundEnabled);

  // ── Init grid from level def ──
  const initLevel = useCallback((lvlIdx: number) => {
    const def = LEVELS[lvlIdx] ?? LEVELS[LEVELS.length - 1];
    const grid: (GridCell | null)[][] = [];
    for (let r = 0; r < def.rows.length; r++) {
      const cols = maxCols(r);
      grid[r] = new Array(cols).fill(null);
      const rowStr = def.rows[r] ?? "";
      for (let c = 0; c < Math.min(rowStr.length, cols); c++) {
        const parsed = parseChar(rowStr[c]);
        if (parsed)
          grid[r][c] = {
            color: parsed.color,
            special: parsed.special,
            iceHits: 0,
          };
      }
    }
    gridRef.current = grid;

    const curr = randomBubble(lvlIdx);
    const next = randomBubble(lvlIdx);
    currentBubRef.current = curr;
    nextBubRef.current = next;
    scoreRef.current = 0;
    shotsRef.current = def.shotLimit;
    levelRef.current = lvlIdx;
    statusRef.current = "playing";
    travelRef.current = null;
    fallingRef.current = [];
    particlesRef.current = [];
    floatScoresRef.current = [];
    aimAngleRef.current = -Math.PI / 2;

    // Background dust
    bgParticlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * CW,
      y: Math.random() * CH,
      r: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.3,
      speed: 0.2 + Math.random() * 0.4,
    }));

    setUiScore(0);
    setUiShots(def.shotLimit);
    setUiLevel(lvlIdx + 1);
    setStatus("playing");
  }, []);

  // ── Ensure grid row exists ──
  function ensureRow(r: number) {
    while (gridRef.current.length <= r) {
      const nr = gridRef.current.length;
      gridRef.current.push(new Array(maxCols(nr)).fill(null));
    }
  }

  // ── Flood fill (BFS) ──
  function floodFill(
    startR: number,
    startC: number,
    color: BubbleColor,
    special: BubbleSpecial,
  ) {
    const grid = gridRef.current;
    const visited = new Set<string>();
    const matches: { r: number; c: number }[] = [];
    const queue: { r: number; c: number }[] = [{ r: startR, c: startC }];

    while (queue.length > 0) {
      const item = queue.shift()!;
      const { r, c } = item;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const cell = grid[r]?.[c];
      if (!cell) continue;

      const isMatch =
        special === "rainbow" ||
        cell.special === "rainbow" ||
        cell.color === color;

      if (!isMatch) continue;

      // Bomb and fire don't chain flood fill
      if (cell.special === "bomb" || cell.special === "fire") continue;

      matches.push({ r, c });

      for (const n of getNeighbors(r, c)) {
        if (validCell(n.r, n.c) && !visited.has(`${n.r},${n.c}`)) {
          queue.push(n);
        }
      }
    }
    return matches;
  }

  // ── Find orphans (not connected to top) ──
  function findOrphans() {
    const grid = gridRef.current;
    const connected = new Set<string>();
    const queue: { r: number; c: number }[] = [];
    // Seed from row 0
    for (let c = 0; c < CE; c++) {
      if (grid[0]?.[c]) queue.push({ r: 0, c });
    }
    while (queue.length > 0) {
      const item = queue.shift()!;
      const { r, c } = item;
      const key = `${r},${c}`;
      if (connected.has(key)) continue;
      if (!grid[r]?.[c]) continue;
      connected.add(key);
      for (const n of getNeighbors(r, c)) {
        if (
          validCell(n.r, n.c) &&
          !connected.has(`${n.r},${n.c}`) &&
          grid[n.r]?.[n.c]
        ) {
          queue.push(n);
        }
      }
    }
    const orphans: { r: number; c: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        if (grid[r][c] && !connected.has(`${r},${c}`)) orphans.push({ r, c });
      }
    }
    return orphans;
  }

  // ── Spawn particles ──
  function spawnParticles(
    x: number,
    y: number,
    color: BubbleColor,
    count = 10,
  ) {
    const fill = BUBBLE_FILL[color];
    const highlight = BUBBLE_HIGHLIGHT[color];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 60 + Math.random() * 120;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? fill : highlight,
        alpha: 1,
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.2,
      });
    }
  }

  // ── Check if grid is empty ──
  function isGridEmpty() {
    return gridRef.current.every((row) => row.every((cell) => cell === null));
  }

  // ── Handle bubble pop result ──
  function processPop(matches: { r: number; c: number }[]) {
    const grid = gridRef.current;
    if (matches.length < 3) return;

    const comboMult =
      matches.length >= 12
        ? 5
        : matches.length >= 8
          ? 3
          : matches.length >= 5
            ? 2
            : 1;
    let points = 0;
    const toRemove: { r: number; c: number }[] = [];

    for (const m of matches) {
      const cell = grid[m.r]?.[m.c];
      if (!cell) continue;
      if (cell.special === "ice" && cell.iceHits === 0) {
        cell.iceHits = 1; // first hit - crack, don't remove
      } else {
        toRemove.push(m);
      }
    }

    for (const { r, c } of toRemove) {
      const cell = grid[r]?.[c];
      if (!cell) continue;
      const { x, y } = cellPx(r, c);
      spawnParticles(x, y, cell.color);
      floatScoresRef.current.push({
        x,
        y,
        value: 100 * comboMult,
        alpha: 1,
        vy: -60,
        combo: comboMult,
      });
      points += 100;
      grid[r][c] = null;
    }

    scoreRef.current += points * comboMult;
    if (comboMult >= 2) sounds.playCombo(matches.length);
    else sounds.playPop();

    // Orphan detection
    const orphans = findOrphans();
    for (const { r, c } of orphans) {
      const cell = grid[r]?.[c];
      if (!cell) continue;
      const { x, y } = cellPx(r, c);
      spawnParticles(x, y, cell.color, 5);
      fallingRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: -30,
        color: cell.color,
        special: cell.special,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 6,
        alpha: 1,
      });
      floatScoresRef.current.push({
        x,
        y,
        value: 50,
        alpha: 1,
        vy: -50,
        combo: 1,
      });
      scoreRef.current += 50;
      grid[r][c] = null;
    }

    if (toRemove.length > 0 || orphans.length > 0) {
      setUiScore(scoreRef.current);
      onUpdateHighScore(scoreRef.current);
    }

    // Check win
    if (isGridEmpty()) {
      const shotLimit = LEVELS[levelRef.current]?.shotLimit ?? 25;
      const shotsLeft = shotsRef.current;
      const pct = shotsLeft / shotLimit;
      const s = pct > 0.5 ? 3 : pct > 0.25 ? 2 : 1;
      const c2 = s === 3 ? 30 : s === 2 ? 20 : 10;
      setStars(s);
      setCoins(c2);
      statusRef.current = "levelcomplete";
      setStatus("levelcomplete");
      sounds.playWin();
    } else {
    }
  }

  // ── Bomb effect ──
  function processBomb(r: number, c: number) {
    const grid = gridRef.current;
    sounds.playBomb();
    const toRemove: { r: number; c: number }[] = [];
    // All neighbors within radius 2
    const visited = new Set<string>();
    const queue = [{ r, c }];
    while (queue.length > 0) {
      const item = queue.shift()!;
      const key = `${item.r},${item.c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const { x: bx, y: by } = cellPx(r, c);
      const { x: tx, y: ty } = cellPx(item.r, item.c);
      if (Math.hypot(bx - tx, by - ty) <= BD * 2.5) {
        if (grid[item.r]?.[item.c]) toRemove.push(item);
        for (const n of getNeighbors(item.r, item.c)) {
          if (validCell(n.r, n.c) && !visited.has(`${n.r},${n.c}`))
            queue.push(n);
        }
      }
    }
    for (const { r: tr, c: tc } of toRemove) {
      const cell = grid[tr]?.[tc];
      if (!cell) continue;
      const { x, y } = cellPx(tr, tc);
      spawnParticles(x, y, cell.color, 12);
      scoreRef.current += 100;
      grid[tr][tc] = null;
    }
    // Spawn extra particles at bomb center
    const { x: bx, y: by } = cellPx(r, c);
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      particlesRef.current.push({
        x: bx,
        y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#FF8A3D",
        alpha: 1,
        size: 4 + Math.random() * 5,
        life: 0,
        maxLife: 0.5,
      });
    }
    grid[r][c] = null;
    setUiScore(scoreRef.current);
    onUpdateHighScore(scoreRef.current);
    const orphans = findOrphans();
    for (const { r: or, c: oc } of orphans) {
      const cell = grid[or]?.[oc];
      if (!cell) continue;
      const { x, y } = cellPx(or, oc);
      spawnParticles(x, y, cell.color, 5);
      fallingRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: -30,
        color: cell.color,
        special: cell.special,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 6,
        alpha: 1,
      });
      scoreRef.current += 50;
      grid[or][oc] = null;
    }
  }

  // ── Fire effect ──
  function processFire(r: number, c: number) {
    const grid = gridRef.current;
    sounds.playBomb();
    // Destroy the row below
    const targetRow = r + 1;
    if (grid[targetRow]) {
      for (let tc = 0; tc < grid[targetRow].length; tc++) {
        const cell = grid[targetRow][tc];
        if (cell) {
          const { x, y } = cellPx(targetRow, tc);
          spawnParticles(x, y, cell.color, 8);
          scoreRef.current += 100;
          grid[targetRow][tc] = null;
        }
      }
    }
    grid[r][c] = null;
    setUiScore(scoreRef.current);
    onUpdateHighScore(scoreRef.current);
  }

  // ── Snap bubble to grid ──
  function snapBubble(tb: TravelingBubble) {
    const grid = gridRef.current;
    const approxRow = Math.round((tb.y - GT) / RH);
    const clampRow = Math.max(0, approxRow);
    let bestR = -1;
    let bestC = -1;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let r = Math.max(0, clampRow - 2); r <= clampRow + 2; r++) {
      ensureRow(r);
      const cols = maxCols(r);
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null) continue;
        const { x, y } = cellPx(r, c);
        const dist = Math.hypot(tb.x - x, tb.y - y);
        if (dist < bestDist) {
          bestDist = dist;
          bestR = r;
          bestC = c;
        }
      }
    }

    if (bestR === -1) {
      // Fallback: put at top
      ensureRow(0);
      for (let c = 0; c < CE; c++) {
        if (!grid[0][c]) {
          bestR = 0;
          bestC = c;
          break;
        }
      }
    }
    if (bestR === -1) return;

    ensureRow(bestR);
    const cell: GridCell = { color: tb.color, special: tb.special, iceHits: 0 };
    grid[bestR][bestC] = cell;
    travelRef.current = null;

    if (tb.special === "bomb") {
      processBomb(bestR, bestC);
    } else if (tb.special === "fire") {
      processFire(bestR, bestC);
    } else {
      const matches = floodFill(bestR, bestC, tb.color, tb.special);
      processPop(matches);
    }

    // Next bubble
    currentBubRef.current = nextBubRef.current;
    const newNext = randomBubble(levelRef.current);
    nextBubRef.current = newNext;

    // Shot count
    shotsRef.current -= 1;
    setUiShots(shotsRef.current);
    if (
      shotsRef.current <= 0 &&
      !isGridEmpty() &&
      statusRef.current === "playing"
    ) {
      statusRef.current = "gameover";
      setStatus("gameover");
    }
  }

  // ── Collision check ──
  function checkCollision(tb: TravelingBubble): boolean {
    if (tb.y <= GT + BR) return true;
    const grid = gridRef.current;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        if (!grid[r][c]) continue;
        const { x, y } = cellPx(r, c);
        if (Math.hypot(tb.x - x, tb.y - y) < BD - 3) return true;
      }
    }
    return false;
  }

  // ── Aim angle from pointer position ──
  function getAimAngle(px: number, py: number): number {
    const dx = px - SX;
    const dy = py - SY;
    let angle = Math.atan2(dy, dx);
    // Clamp to upward-only
    if (angle > -0.15) angle = -0.15;
    if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
    return angle;
  }

  // ── Canvas position from event ──
  function getCanvasPos(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CW / rect.width),
      y: (clientY - rect.top) * (CH / rect.height),
    };
  }

  // ── Shoot ──
  function shoot() {
    if (travelRef.current || statusRef.current !== "playing") return;
    const angle = aimAngleRef.current;
    const curr = currentBubRef.current;
    travelRef.current = {
      x: SX,
      y: SY,
      vx: Math.cos(angle) * BSPEED,
      vy: Math.sin(angle) * BSPEED,
      color: curr.color,
      special: curr.special,
    };
    sounds.playShoot();
  }

  // ── Input handlers ──
  function handlePointerDown(clientX: number, clientY: number) {
    if (statusRef.current !== "playing") return;
    const pos = getCanvasPos(clientX, clientY);
    if (pos.y > SY - 50) return; // below shooter
    isAimingRef.current = true;
    aimAngleRef.current = getAimAngle(pos.x, pos.y);
  }
  function handlePointerMove(clientX: number, clientY: number) {
    if (!isAimingRef.current || statusRef.current !== "playing") return;
    const pos = getCanvasPos(clientX, clientY);
    aimAngleRef.current = getAimAngle(pos.x, pos.y);
  }
  function handlePointerUp(clientX: number, clientY: number) {
    if (!isAimingRef.current || statusRef.current !== "playing") return;
    isAimingRef.current = false;
    const pos = getCanvasPos(clientX, clientY);
    aimAngleRef.current = getAimAngle(pos.x, pos.y);
    shoot();
  }

  // ── Main game loop ──
  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: game loop runs once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;

    // Canvas sizing
    const resize = () => {
      const w = Math.min(container.clientWidth, 480);
      const h = Math.round(w * (CH / CW));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = CW;
      canvas.height = CH;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse
    const onMD = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMM = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMU = (e: MouseEvent) => handlePointerUp(e.clientX, e.clientY);
    // Touch
    const onTD = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handlePointerDown(t.clientX, t.clientY);
    };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handlePointerMove(t.clientX, t.clientY);
    };
    const onTU = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) handlePointerUp(t.clientX, t.clientY);
    };

    canvas.addEventListener("mousedown", onMD);
    canvas.addEventListener("mousemove", onMM);
    canvas.addEventListener("mouseup", onMU);
    canvas.addEventListener("touchstart", onTD, { passive: false });
    canvas.addEventListener("touchmove", onTM, { passive: false });
    canvas.addEventListener("touchend", onTU, { passive: false });

    let lastTime = 0;

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (dt <= 0) return;
      timeRef.current += dt;
      const t = timeRef.current;

      if (statusRef.current === "paused") {
        // Still render so frame looks right
        renderFrame(ctx, t);
        return;
      }
      if (statusRef.current !== "playing") {
        renderFrame(ctx, t);
        return;
      }

      // ── Update ──
      // Traveling bubble
      const tb = travelRef.current;
      if (tb) {
        tb.x += tb.vx * dt;
        tb.y += tb.vy * dt;
        if (tb.x < BR) {
          tb.x = BR;
          tb.vx = Math.abs(tb.vx);
        }
        if (tb.x > CW - BR) {
          tb.x = CW - BR;
          tb.vx = -Math.abs(tb.vx);
        }
        if (checkCollision(tb)) snapBubble(tb);
      }

      // Falling bubbles
      fallingRef.current = fallingRef.current.filter((fb) => fb.alpha > 0);
      for (const fb of fallingRef.current) {
        fb.x += fb.vx * dt;
        fb.y += fb.vy * dt;
        fb.vy += 400 * dt;
        fb.rotation += fb.rotSpeed * dt;
        fb.alpha -= dt * 1.5;
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(
        (p) => p.life < p.maxLife,
      );
      for (const p of particlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
        p.life += dt;
        p.alpha = 1 - p.life / p.maxLife;
      }

      // Floating scores
      floatScoresRef.current = floatScoresRef.current.filter(
        (fs) => fs.alpha > 0,
      );
      for (const fs of floatScoresRef.current) {
        fs.y += fs.vy * dt;
        fs.alpha -= dt * 1.8;
      }

      // Background particles
      for (const bp of bgParticlesRef.current) {
        bp.y -= bp.speed * dt * 30;
        if (bp.y < -5) {
          bp.y = CH + 5;
          bp.x = Math.random() * CW;
        }
      }

      renderFrame(ctx, t);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMD);
      canvas.removeEventListener("mousemove", onMM);
      canvas.removeEventListener("mouseup", onMU);
      canvas.removeEventListener("touchstart", onTD);
      canvas.removeEventListener("touchmove", onTM);
      canvas.removeEventListener("touchend", onTU);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // ── Render ──
  function renderFrame(ctx: CanvasRenderingContext2D, t: number) {
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#0F1535");
    bg.addColorStop(1, "#070A12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // Background glow
    const glow = ctx.createRadialGradient(
      CW / 2,
      CH * 0.35,
      30,
      CW / 2,
      CH * 0.35,
      200,
    );
    glow.addColorStop(0, "rgba(124,77,255,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CW, CH);

    // Background dust
    for (const bp of bgParticlesRef.current) {
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${bp.alpha * 0.5})`;
      ctx.fill();
    }

    // Grid top line glow
    const lineGrad = ctx.createLinearGradient(0, GT - BR - 2, CW, GT - BR - 2);
    lineGrad.addColorStop(0, "rgba(95,227,255,0)");
    lineGrad.addColorStop(0.5, "rgba(95,227,255,0.4)");
    lineGrad.addColorStop(1, "rgba(95,227,255,0)");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GT - BR - 2);
    ctx.lineTo(CW, GT - BR - 2);
    ctx.stroke();

    // Grid bubbles
    const grid = gridRef.current;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        const cell = grid[r][c];
        if (!cell) continue;
        const { x, y } = cellPx(r, c);
        drawBubble(ctx, x, y, BR, cell.color, cell.special, cell.iceHits, 1, t);
      }
    }

    // Traveling bubble
    const tb = travelRef.current;
    if (tb) {
      drawBubble(ctx, tb.x, tb.y, BR, tb.color, tb.special, 0, 1, t);
    }

    // Aim line (only while aiming and not traveling)
    if (isAimingRef.current && !travelRef.current) {
      drawAimLine(ctx, aimAngleRef.current);
    }

    // Shooter
    drawShooter(ctx, aimAngleRef.current, currentBubRef.current, t);

    // Next bubble preview (bottom left)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.roundRect(8, CH - 52, 56, 44, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 9px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NEXT", 36, CH - 40);
    drawBubble(
      ctx,
      36,
      CH - 24,
      13,
      nextBubRef.current.color,
      nextBubRef.current.special,
      0,
      1,
      t,
    );
    ctx.restore();

    // Falling bubbles
    for (const fb of fallingRef.current) {
      ctx.save();
      ctx.translate(fb.x, fb.y);
      ctx.rotate(fb.rotation);
      drawBubble(ctx, 0, 0, BR - 2, fb.color, fb.special, 0, fb.alpha, t);
      ctx.restore();
    }

    // Particles
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating scores
    for (const fs of floatScoresRef.current) {
      ctx.save();
      ctx.globalAlpha = fs.alpha;
      ctx.font = `bold ${fs.combo > 1 ? 18 : 13}px Nunito, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = fs.combo > 1 ? "#FFD43B" : "#ffffff";
      ctx.fillText(
        fs.combo > 1 ? `+${fs.value} x${fs.combo}!` : `+${fs.value}`,
        fs.x,
        fs.y,
      );
      ctx.restore();
    }

    // Danger zone line
    const dangerY = SY - 90;
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255,50,50,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(CW, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Level navigation ──
  const [currentLevel, setCurrentLevel] = useState(level);

  function handleNextLevel() {
    const next = currentLevel + 1;
    if (next >= LEVELS.length) {
      onMenu();
      return;
    }
    setCurrentLevel(next);
    initLevel(next);
  }
  function handleRestart() {
    initLevel(currentLevel);
  }
  function handleResume() {
    statusRef.current = "playing";
    setStatus("playing");
  }
  function handlePause() {
    statusRef.current = "paused";
    setStatus("paused");
  }

  const dangerBubbles = gridRef.current.some((row) =>
    row?.some((cell) => {
      if (!cell) return false;
      const rowIdx = gridRef.current.indexOf(row);
      return cellPx(rowIdx, 0).y > SY - 100;
    }),
  );

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full h-full"
      style={{ background: "#070A12" }}
    >
      {/* Canvas */}
      <div className="relative" style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
        />

        {/* HUD overlay */}
        <div
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{ width: canvasRef.current?.style.width || "100%" }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex flex-col items-start">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                Score
              </span>
              <span className="text-yellow-300 text-xl font-black">
                {uiScore.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                Level
              </span>
              <span className="text-cyan-300 text-xl font-black">
                {uiLevel}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                Shots
              </span>
              <span
                className={`text-xl font-black ${uiShots <= 5 ? "text-red-400" : "text-white"}`}
              >
                {uiShots}
              </span>
            </div>
          </div>

          {dangerBubbles && (
            <div className="text-center text-red-400 text-xs font-bold animate-pulse">
              ⚠ Bubbles too close!
            </div>
          )}
        </div>

        {/* Pause button */}
        <button
          type="button"
          data-ocid="game.pause_button"
          onClick={handlePause}
          className="absolute bottom-3 right-3 pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          ⏸
        </button>

        {/* Overlays */}
        {status === "paused" && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={handleRestart}
            onMenu={onMenu}
            score={uiScore}
            level={uiLevel}
          />
        )}
        {status === "levelcomplete" && (
          <LevelComplete
            level={uiLevel}
            score={uiScore}
            stars={stars}
            coins={coins}
            onNext={handleNextLevel}
            onMenu={onMenu}
            soundEnabled={soundEnabled}
          />
        )}
        {status === "gameover" && (
          <GameOver
            score={uiScore}
            highScore={highScore}
            level={uiLevel}
            onRestart={handleRestart}
            onMenu={onMenu}
          />
        )}
      </div>
    </div>
  );
}
