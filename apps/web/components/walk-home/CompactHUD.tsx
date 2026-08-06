import styles from "./WalkHomeShell.module.css";

export function CompactHUD({ selectedChapter, compact }: { selectedChapter: string; compact: boolean }) {
  if (!compact) return null;
  return (
    <article className={styles.panel} style={{ minHeight: 0 }}>
      <strong>2026 / 07 / 31</strong>
      <span style={{ marginLeft: 12 }}>Chapter: {selectedChapter}</span>
      <span style={{ float: "right" }}>21:47 ☀</span>
    </article>
  );
}
