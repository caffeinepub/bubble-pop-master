import type { LevelDef } from "./bubbleTypes";

// Bubble codes:
// R=red Y=yellow G=green B=blue P=purple O=orange
// b=bomb w=rainbow I=ice F=fire _=empty
export const LEVELS: LevelDef[] = [
  {
    description: "Warm Up",
    shotLimit: 25,
    rows: [
      "RRRYYYGGG", // row 0 even (9 cols)
      "RRYYYYGG", // row 1 odd  (8 cols)
      "YYYGGGRRR", // row 2 even
      "YGGGRRRR", // row 3 odd
    ],
  },
  {
    description: "Icy Waters",
    shotLimit: 28,
    rows: [
      "RRIBBBIR R".replace(/ /g, ""),
      "RBBIIIBR",
      "BBIRRRIIB",
      "BIRRRRIB",
      "RRIBBRII",
    ],
  },
  {
    description: "Bomb Squad",
    shotLimit: 28,
    rows: ["RRYYbGGBB", "RYYGGbBB", "YYGbBBRRY", "YGBBRRbY", "GBBRRYYb"],
  },
  {
    description: "Rainbow Road",
    shotLimit: 30,
    rows: [
      "RRYYwGGBB",
      "RYwGGBBP",
      "YwGBBPPRR",
      "wGBPPRRY",
      "GBPRRYYw",
      "BPRYYwGG",
    ],
  },
  {
    description: "Fire & Ice",
    shotLimit: 30,
    rows: [
      "RRIIbbRRY",
      "RIbRRbYY",
      "IbRRYYGGG",
      "bRYYGGwG",
      "RYGGwBBB",
      "YGwBBPPP",
    ],
  },
  {
    description: "Inferno",
    shotLimit: 32,
    rows: [
      "RRYYGGBBb",
      "RYGGBBbP",
      "YGBBbPPOO",
      "GBbPPOwR",
      "BbPOOwRRY",
      "bPOwRRYYG",
      "POFRYYGGb",
    ],
  },
  {
    description: "Chaos Theory",
    shotLimit: 35,
    rows: [
      "RbYYGGwBP",
      "bYGwBBPO",
      "YGwBPPOOR",
      "GwBPOwRRY",
      "wBPObRYYG",
      "BPObIYGGB",
      "PObIIGBBR",
      "ObIIBRRP",
    ],
  },
  {
    description: "Final Frontier",
    shotLimit: 35,
    rows: [
      "RRbYYbGGB",
      "RbYGGbBP",
      "bYGwBbPOR",
      "YGwBPObY",
      "GwBPOwRRG",
      "wBPOwRYYB",
      "BPOwIYGGP",
      "POwIIGBBO",
    ],
  },
];

export function parseChar(ch: string): {
  color: import("./bubbleTypes").BubbleColor;
  special: import("./bubbleTypes").BubbleSpecial;
} | null {
  switch (ch) {
    case "R":
      return { color: "red", special: "normal" };
    case "Y":
      return { color: "yellow", special: "normal" };
    case "G":
      return { color: "green", special: "normal" };
    case "B":
      return { color: "blue", special: "normal" };
    case "P":
      return { color: "purple", special: "normal" };
    case "O":
      return { color: "orange", special: "normal" };
    case "b":
      return { color: "orange", special: "bomb" };
    case "w":
      return { color: "red", special: "rainbow" };
    case "I":
      return { color: "blue", special: "ice" };
    case "F":
      return { color: "orange", special: "fire" };
    default:
      return null;
  }
}
