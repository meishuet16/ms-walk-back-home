import { createFixtureAuthAdapter, createFixtureDiaryStore } from "@walk/shared";
import { PortalBadge } from "@walk/ui";
import { ImportComposerWorkspace } from "../components/ImportComposerWorkspace";
import { GodotForestEmbed } from "../features/forest/GodotForestEmbed";

const diaryStore = createFixtureDiaryStore();
const auth = createFixtureAuthAdapter();

export default async function HomePage() {
  const [session, entries] = await Promise.all([auth.getSession(), diaryStore.listEntries()]);

  return (
    <main className="shell">
      <GodotForestEmbed />
      <div className="workspace">
        <section className="panel forest-panel" aria-labelledby="forest-title">
          <p>Local fixture mode · {session.user.displayName}</p>
          <h1 id="forest-title">Walk Back Home</h1>
          <p>陪过去的自己，再走一次。</p>
          <div className="forest-stage" aria-label="Memory Forest fixture preview">
            <div className="portal">
              <PortalBadge state="playable">playable</PortalBadge>
              <strong>Bakery Day</strong>
              <span>2030-01-01</span>
            </div>
            <div className="portal">
              <PortalBadge state="imported">imported</PortalBadge>
              <strong>Lantern Road</strong>
              <span>2030-01-02</span>
            </div>
            <div className="portal">
              <PortalBadge state="locked">locked</PortalBadge>
              <strong>Quiet Door</strong>
              <span>fixture</span>
            </div>
            <div className="muji" aria-label="Muji fixture avatar" />
          </div>
        </section>

        <aside className="panel library-panel" aria-labelledby="library-title">
          <h2 id="library-title">Diary Library</h2>
          <p>Fictional entries only. No paid APIs, no remote AI calls.</p>
          <div className="entry-list">
            {entries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <PortalBadge state="imported">{entry.privacyTag}</PortalBadge>
                <h3>{entry.title}</h3>
                <time dateTime={entry.entryDate}>{entry.entryDate}</time>
                <p>{entry.body}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
      <ImportComposerWorkspace />
    </main>
  );
}
