export function GodotForestEmbed() {
  return (
    <section className="primary-forest" aria-labelledby="primary-forest-title">
      <div className="primary-forest-copy">
        <p>Local fixture mode</p>
        <h1 id="primary-forest-title">Walk Back Home</h1>
        <p>陪过去的自己，再走一次。</p>
      </div>
      <iframe
        className="godot-frame"
        src="/game/memory-forest.html"
        title="Playable Memory Forest"
        loading="eager"
      />
    </section>
  );
}
