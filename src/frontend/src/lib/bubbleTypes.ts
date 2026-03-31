export type BubbleColor =
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "orange";
export type BubbleSpecial = "normal" | "bomb" | "rainbow" | "ice" | "fire";

export interface GridCell {
  color: BubbleColor;
  special: BubbleSpecial;
  iceHits: number; // 0 = intact, 1 = cracked
}

export interface TravelingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  special: BubbleSpecial;
}

export interface FallingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  color: BubbleColor;
  special: BubbleSpecial;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingScore {
  x: number;
  y: number;
  value: number;
  alpha: number;
  vy: number;
  combo: number;
}

export type AppScreen = "splash" | "menu" | "game" | "gameover";

export interface LevelDef {
  rows: string[];
  shotLimit: number;
  description: string;
}

export const BUBBLE_FILL: Record<BubbleColor, string> = {
  red: "#FF3B3B",
  yellow: "#FFD43B",
  green: "#3DFF7A",
  blue: "#3BA7FF",
  purple: "#B04BFF",
  orange: "#FF8A3D",
};

export const BUBBLE_HIGHLIGHT: Record<BubbleColor, string> = {
  red: "#FF9090",
  yellow: "#FFEE90",
  green: "#90FFB8",
  blue: "#90D0FF",
  purple: "#D890FF",
  orange: "#FFBC80",
};

export const BUBBLE_DARK: Record<BubbleColor, string> = {
  red: "#CC0000",
  yellow: "#CC9000",
  green: "#00BB44",
  blue: "#0055CC",
  purple: "#7700CC",
  orange: "#CC4400",
};
