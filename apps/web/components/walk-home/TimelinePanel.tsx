import { timelineEntries } from "./fixtures";
import styles from "./WalkHomeShell.module.css";

export function TimelinePanel({ selectedChapter, onSelect }: { selectedChapter: string; onSelect: (title: string) => void }) {
  return (
    <article className={styles.panel}>
      <h2>Diary Timeline</h2>
      <p>Your life, day by day</p>
      <div className={styles.timeline}>
        {timelineEntries.map(([date, title, icon]) => (
          <button key={title} className={`${styles.timelineItem} ${selectedChapter === title ? styles.selected : ""}`} onClick={() => onSelect(title)}>
            <span>{date}</span><strong>{title}</strong><span>{icon}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
