"use client";

import { useEffect, useState } from "react";
import styles from "./WalkHomeShell.module.css";
import { MemoryForestCanvas } from "./MemoryForestCanvas";
import { ScrapbookPanel } from "./ScrapbookPanel";
import { TimelinePanel } from "./TimelinePanel";
import { RelationshipsPanel } from "./RelationshipsPanel";
import { MiniGamesPanel } from "./MiniGamesPanel";
import { MujiRoomPanel } from "./MujiRoomPanel";
import { MemoryMapPanel } from "./MemoryMapPanel";
import { DialogueBox } from "./DialogueBox";
import { CompactHUD } from "./CompactHUD";
import type { MemoryDoorData } from "./fixtures";

export function WalkHomeShell() {
  const [compact, setCompact] = useState(false);
  const [rain, setRain] = useState(true);
  const [muted, setMuted] = useState(false);
  const [view, setView] = useState<"forest" | "dashboard">("forest");
  const [activeDoor, setActiveDoor] = useState<MemoryDoorData | null>(null);
  const [selectedChapter, setSelectedChapter] = useState("Went to Segamat");

  useEffect(() => {
    const saved = window.localStorage.getItem("walk-home:last-chapter");
    if (saved) setSelectedChapter(saved);
  }, []);

  const openDoor = (door: MemoryDoorData) => {
    setActiveDoor(door);
    setSelectedChapter(door.title);
    window.localStorage.setItem("walk-home:last-chapter", door.title);
  };

  return (
    <main className={`${styles.shell} ${compact ? styles.compact : ""}`}>
      <div className={styles.topbar}>
        <div className={styles.brand}>Walk Back Home</div>
        <div className={styles.controls}>
          <button className={`${styles.button} ${view === "forest" ? styles.active : ""}`} onClick={() => setView("forest")}>Forest View</button>
          <button className={`${styles.button} ${view === "dashboard" ? styles.active : ""}`} onClick={() => setView("dashboard")}>Dashboard View</button>
          <button className={styles.button} onClick={() => setCompact((value) => !value)}>{compact ? "Standard 960x540" : "Compact 480x270"}</button>
          <button className={styles.button} onClick={() => document.documentElement.requestFullscreen?.()}>Fullscreen</button>
          <button className={styles.button} onClick={() => setRain((value) => !value)}>{rain ? "Rain On" : "Rain Off"}</button>
          <button className={styles.button} onClick={() => setMuted((value) => !value)}>{muted ? "Muted" : "Soft Audio"}</button>
        </div>
      </div>

      <section className={styles.layout}>
        {view === "forest" ? (
          <div className={styles.forestWrap}>
            <MemoryForestCanvas compact={compact} rain={rain} muted={muted} onDoorOpen={openDoor} />
          </div>
        ) : null}
        <CompactHUD selectedChapter={selectedChapter} compact={compact} />
        <section className={styles.dashboard}>
          <DialogueBox selectedChapter={selectedChapter} />
          <ScrapbookPanel onSelect={setSelectedChapter} />
          <TimelinePanel selectedChapter={selectedChapter} onSelect={setSelectedChapter} />
        </section>
        <section className={styles.lowerGrid}>
          <RelationshipsPanel />
          <MiniGamesPanel />
          <MujiRoomPanel />
          <MemoryMapPanel />
        </section>
        <section className={`${styles.panel} ${styles.footer}`}>
          <div><h2>Meet NPCs</h2><p>They live in your memories.</p><img className={styles.stripImg} src="/play-assets/npc-strip.jpg" alt="" /></div>
          <div><h2>Dynamic World</h2><p>Time, weather, and seasons change.</p><img className={styles.stripImg} src="/play-assets/weather-strip.jpg" alt="" /></div>
          <div><h2>Prototype Note</h2><p>Screenshot-driven HTML simulation. Muji is the playable water bottle.</p></div>
        </section>
      </section>

      {activeDoor ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2>{activeDoor.date} · {activeDoor.title}</h2>
            <p>{activeDoor.mood}</p>
            <p>{activeDoor.line}</p>
            <button className={styles.button} onClick={() => setActiveDoor(null)}>Return to Forest</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
