"use client";

import { useState } from "react";
import { scrapbookItems } from "./fixtures";
import styles from "./WalkHomeShell.module.css";

export function ScrapbookPanel({ onSelect }: { onSelect: (title: string) => void }) {
  const [category, setCategory] = useState("All");
  const items = category === "All" ? scrapbookItems : scrapbookItems.filter((item) => item.category === category);
  return (
    <article className={styles.panel}>
      <h2>AI Scrapbook</h2>
      <p>Muji&apos;s art from your memories</p>
      <div className={styles.tabs}>
        {["All", "People", "Places", "Things"].map((tab) => (
          <button className={`${styles.button} ${category === tab ? styles.active : ""}`} key={tab} onClick={() => setCategory(tab)}>{tab}</button>
        ))}
      </div>
      <div className={styles.scrapGrid}>
        {items.map((item, index) => (
          <button className={styles.polaroid} style={{ "--tilt": `${index % 2 ? 2 : -3}deg` } as React.CSSProperties} key={item.id} onClick={() => onSelect(item.title)}>
            <img src={item.image} alt="" />
            <strong>{item.title}</strong>
            <span>{item.date}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
