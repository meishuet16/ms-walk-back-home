export type MemoryDoorData = {
  id: string;
  date: string;
  title: string;
  x: number;
  y: number;
  mood: string;
  line: string;
};

export const memoryDoors: MemoryDoorData[] = [
  { id: "segamat", date: "07.31", title: "Went to Segamat", x: 515, y: 272, mood: "Warm rain", line: "Muji remembers the road glowing after sunset." },
  { id: "yumido", date: "07.28", title: "Yumido Bread", x: 430, y: 108, mood: "Amber", line: "The bakery window was brighter than the street." },
  { id: "night-walk", date: "07.27", title: "Night Walk", x: 382, y: 178, mood: "Quiet", line: "Footsteps, flowers, and small lights by the trees." },
  { id: "palapes", date: "07.26", title: "Palapes Meeting", x: 572, y: 132, mood: "Tired brave", line: "Friend A waved from near the lamp." },
  { id: "late-call", date: "07.26", title: "Late Call", x: 672, y: 202, mood: "Soft blue", line: "A door opened inside the branches." },
  { id: "august", date: "08.25", title: "August Porch", x: 684, y: 304, mood: "Hopeful", line: "The porch light waited like a promise." },
];

export const scrapbookItems = [
  { id: "tea", category: "People", title: "Tealive with ET", date: "2026.06.25", image: "/play-assets/scrapbook-panel.jpg" },
  { id: "bread", category: "Places", title: "Yumido", date: "2026.07.25", image: "/play-assets/current-memory.jpg" },
  { id: "palapes", category: "People", title: "Palapes", date: "2026.07.20", image: "/play-assets/forest-stage.jpg" },
  { id: "night", category: "Things", title: "Night talks", date: "2026.07.12", image: "/play-assets/forest.png" },
];

export const timelineEntries = [
  ["JUL 31", "Went to Segamat", "★"],
  ["JUL 30", "Palapes Meeting", "♡"],
  ["JUL 29", "Late night talks", "☾"],
  ["JUL 28", "Yumido bread", "▣"],
  ["JUL 27", "Watson trip", "◇"],
] as const;
