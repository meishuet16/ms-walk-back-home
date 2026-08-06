import styles from "./WalkHomeShell.module.css";

export function MujiRoomPanel() {
  return (
    <article className={styles.panel}>
      <h2>Muji&apos;s Room</h2>
      <img className={styles.thumb} src="/play-assets/room-panel.jpg" alt="" />
      <div className={styles.roomActions}>
        {["Talk", "Gift", "Dress", "Diary"].map((item) => <button className={styles.button} key={item}>{item}</button>)}
      </div>
    </article>
  );
}
