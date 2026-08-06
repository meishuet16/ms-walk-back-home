"use client";

import { useEffect, useRef, useState } from "react";
import { memoryDoors, type MemoryDoorData } from "./fixtures";

type Props = {
  compact: boolean;
  rain: boolean;
  muted: boolean;
  onDoorOpen: (door: MemoryDoorData) => void;
};

type Point = { x: number; y: number };

const keys = new Set<string>();
const walkable = [
  { x: 410, y: 255, w: 200, h: 230 },
  { x: 310, y: 350, w: 380, h: 145 },
  { x: 490, y: 120, w: 82, h: 240 },
  { x: 365, y: 120, w: 110, h: 170 },
  { x: 610, y: 160, w: 100, h: 210 },
];

function insideWalkable(p: Point) {
  return walkable.some((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
}

function loadImage(src: string) {
  const image = new Image();
  image.src = src;
  return image;
}

export function MemoryForestCanvas({ compact, rain, muted, onDoorOpen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nearDoor, setNearDoor] = useState<MemoryDoorData | null>(null);
  const [prompt, setPrompt] = useState("Walk with Muji. WASD / arrows move.");
  const joystick = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = loadImage("/play-assets/forest-stage.jpg");
    const muji = loadImage("/play-assets/muji-sheet.png");
    let player: Point = { x: 520, y: 454 };
    let facing = 0;
    let frame = 0;
    let last = performance.now();
    let raf = 0;
    const fireflies = Array.from({ length: 42 }, (_, i) => ({
      x: 70 + ((i * 137) % 850),
      y: 50 + ((i * 73) % 405),
      s: 0.7 + (i % 5) * 0.22,
    }));

    const draw = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const width = compact ? 480 : 960;
      const height = compact ? 270 : 540;
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;

      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if (keys.has("arrowup") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;
      dx += joystick.current.x;
      dy += joystick.current.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.05) {
        dx /= Math.max(1, len);
        dy /= Math.max(1, len);
        facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
        const next = { x: player.x + dx * 135 * dt, y: player.y + dy * 135 * dt };
        if (insideWalkable(next)) player = next;
        frame = Math.floor(now / 130) % 4;
      } else {
        frame = 0;
      }

      const cameraX = Math.max(0, Math.min(64, player.x - 480));
      ctx.drawImage(bg, cameraX, 0, 960, 512, 0, 0, width, height);

      ctx.fillStyle = "rgba(1, 8, 18, .22)";
      ctx.fillRect(0, 0, width, height);
      const scale = width / 960;
      for (const door of memoryDoors) {
        const sx = (door.x - cameraX) * scale;
        const sy = door.y * scale;
        const dist = Math.hypot(player.x - door.x, player.y - door.y);
        const active = dist < 58;
        const pulse = 0.55 + Math.sin(now / 220 + door.x) * 0.25;
        const radius = (active ? 44 : 28) * scale;
        const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, radius);
        glow.addColorStop(0, `rgba(255, 197, 86, ${active ? 0.82 : 0.48 + pulse * 0.2})`);
        glow.addColorStop(1, "rgba(255, 157, 40, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff2c8";
        ctx.font = `${12 * scale}px Courier New`;
        ctx.fillText(door.date, sx - 18 * scale, sy - 36 * scale);
      }

      for (const f of fireflies) {
        const sx = ((f.x - cameraX * 0.35) % 960) * scale;
        const sy = (f.y + Math.sin(now / 900 + f.x) * 7) * scale;
        ctx.fillStyle = `rgba(255, 210, 83, ${0.25 + Math.sin(now / 310 + f.x) * 0.18})`;
        ctx.fillRect(sx, sy, f.s * scale, f.s * scale);
      }
      if (rain) {
        ctx.strokeStyle = "rgba(141, 192, 218, .22)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 70; i++) {
          const x = ((i * 47 + now / 18) % width);
          const y = ((i * 91 + now / 8) % height);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 5, y + 14);
          ctx.stroke();
        }
      }

      const bob = len > 0.05 ? Math.sin(now / 90) * 2 : Math.sin(now / 520) * 1.5;
      const frameW = 96;
      const frameH = 112;
      const drawW = 48 * scale;
      const drawH = 56 * scale;
      ctx.drawImage(muji, frame * frameW, facing * frameH, frameW, frameH, (player.x - cameraX) * scale - drawW / 2, player.y * scale - drawH + bob, drawW, drawH);

      const closest = memoryDoors.find((door) => Math.hypot(player.x - door.x, player.y - door.y) < 58) ?? null;
      setNearDoor((current) => (current?.id === closest?.id ? current : closest));
      setPrompt(closest ? `Press E · ${closest.date} ${closest.title}` : muted ? "Walk quietly through the memory forest." : "Walk with Muji. WASD / arrows move.");

      ctx.fillStyle = "rgba(0,0,0,.32)";
      ctx.fillRect(0, 0, width, height);
      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.28, width / 2, height / 2, height * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,.56)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      raf = requestAnimationFrame(draw);
    };

    const down = (event: KeyboardEvent) => {
      keys.add(event.key.toLowerCase());
      if (event.key.toLowerCase() === "e" && nearDoor) onDoorOpen(nearDoor);
    };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [compact, muted, nearDoor, onDoorOpen, rain]);

  return (
    <div style={{ position: "relative", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block", imageRendering: "pixelated" }} />
      <div style={{ position: "absolute", left: 18, bottom: 18, padding: "8px 12px", color: "#ffe8b7", background: "rgba(5,12,20,.72)", border: "1px solid rgba(242,190,104,.45)", borderRadius: 4 }}>{prompt}</div>
      <button onClick={() => nearDoor && onDoorOpen(nearDoor)} style={{ position: "absolute", right: 18, bottom: 18, padding: "12px 16px", borderRadius: 6, border: "1px solid #f0bb6a", background: "#3e2918", color: "#fff1cf" }}>E</button>
      <div
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          joystick.current = { x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 };
        }}
        onPointerLeave={() => { joystick.current = { x: 0, y: 0 }; }}
        style={{ position: "absolute", left: 18, bottom: 62, width: 82, height: 82, borderRadius: "50%", border: "1px solid rgba(255,255,255,.28)", background: "rgba(8,21,34,.34)" }}
      />
    </div>
  );
}
