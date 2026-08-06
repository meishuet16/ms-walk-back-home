import styles from "./WalkHomeShell.module.css";

export function DialogueBox({ selectedChapter }: { selectedChapter: string }) {
  return (
    <article className={styles.panel}>
      <img className={styles.thumb} src="/play-assets/current-memory.jpg" alt="" />
      <div className={styles.dialogue}>
        <img className={styles.portrait} src="/play-assets/muji-sheet.png" alt="" />
        <strong>Muji</strong>
        <p>{selectedChapter === "Yumido Bread" ? "That day, the window smelled like butter and rain." : "Every memory is a way back home."}</p>
      </div>
    </article>
  );
}
