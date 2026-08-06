import styles from "./WalkHomeShell.module.css";

export function RelationshipsPanel() {
  return (
    <article className={styles.panel}>
      <h2>Relationships</h2>
      {["ET · Bestie & Special", "Angela · Best Friend", "ST · Good Friend", "Friend A · Bakery Friend"].map((row, i) => (
        <div className={styles.relation} key={row}><span>{row}</span><span>{"♥".repeat(6 - i)}{"♡".repeat(i + 1)}</span></div>
      ))}
    </article>
  );
}
