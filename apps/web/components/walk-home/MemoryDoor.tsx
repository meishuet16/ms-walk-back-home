import type { MemoryDoorData } from "./fixtures";

export function MemoryDoor({ door }: { door: MemoryDoorData }) {
  return <span>{door.date} · {door.title}</span>;
}
