import styles from "./WalkHomeShell.module.css";

export function MiniGamesPanel() {
  return (
    <article className={styles.panel}>
      <h2>Mini Games</h2>
      {["Card Memories 23/60", "Cat Journey 12/30", "Mood Match 18/40", "Photo Puzzle 9/30"].map((row) => (
        <button className={styles.gameRow} key={row}>{row}<span>›</span></button>
      ))}
    </article>
  );
}
