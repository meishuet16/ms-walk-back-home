"use client";

import { useEffect, useState } from "react";

const GODOT_WEB_EXPORT_PATH = "/game/index.html";
const TEMPORARY_FALLBACK_PATH = "/game/memory-forest.html";

export function GodotForestEmbed() {
  const [gameSrc, setGameSrc] = useState(GODOT_WEB_EXPORT_PATH);
  const runtimeLabel =
    gameSrc === GODOT_WEB_EXPORT_PATH ? "Godot Web runtime" : "HTML fallback runtime";
  const showRuntimeIndicator = process.env.NODE_ENV === "development";

  useEffect(() => {
    let cancelled = false;

    fetch(GODOT_WEB_EXPORT_PATH, { method: "HEAD" })
      .then((response) => {
        if (!cancelled && !response.ok) {
          setGameSrc(TEMPORARY_FALLBACK_PATH);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGameSrc(TEMPORARY_FALLBACK_PATH);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="primary-forest"
      data-runtime={gameSrc === GODOT_WEB_EXPORT_PATH ? "godot" : "fallback"}
      aria-labelledby="primary-forest-title"
    >
      <div className="primary-forest-copy">
        <p>Local fixture mode</p>
        <h1 id="primary-forest-title">Walk Back Home</h1>
        <p>陪过去的自己，再走一次。</p>
      </div>
      {showRuntimeIndicator ? (
        <div className="runtime-indicator" aria-live="polite">
          {runtimeLabel}
        </div>
      ) : null}
      <iframe
        className="godot-frame"
        src={gameSrc}
        title="Playable Memory Forest"
        loading="eager"
      />
    </section>
  );
}
