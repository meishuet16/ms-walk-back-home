import Link from "next/link";
import { createFixtureDiaryStore } from "@walk/shared";
import { PortalBadge } from "@walk/ui";

const diaryStore = createFixtureDiaryStore();

export default async function LibraryPage() {
  const entries = await diaryStore.listEntries();

  return (
    <main className="shell">
      <section className="week-two route-surface" aria-labelledby="library-title">
        <div className="week-two-header">
          <div>
            <p>Fictional runtime library</p>
            <h1 id="library-title">Diary Library</h1>
          </div>
          <Link className="text-link" href="/import">
            Add entries
          </Link>
        </div>
        <div className="entry-list library-route-list">
          {entries.map((entry) => (
            <article className="entry-card" key={entry.id}>
              <PortalBadge state="imported">{entry.privacyTag}</PortalBadge>
              <h2>{entry.title}</h2>
              <time dateTime={entry.entryDate}>{entry.entryDate}</time>
              <p>{entry.body}</p>
              <Link className="text-link" href={`/composer/${entry.id}`}>
                Open composer
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
