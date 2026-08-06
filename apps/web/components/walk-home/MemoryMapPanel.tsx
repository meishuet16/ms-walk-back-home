import styles from "./WalkHomeShell.module.css";

export function MemoryMapPanel() {
  return (
    <article className={styles.panel}>
      <h2>Memory Map</h2>
      <img className={styles.thumb} src="/play-assets/map-panel.jpg" alt="" />
      {["Home Town", "School", "Forest", "Beach", "City", "??? Locked"].map((place) => (
        <button className={styles.mapMarker} key={place}>{place}<span>✦</span></button>
      ))}
    </article>
  );
}
