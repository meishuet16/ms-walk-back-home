import Link from "next/link";
import { MemoryComposer } from "../../../features/composer/MemoryComposer";

type ComposerPageProps = {
  params: Promise<{ entryId: string }>;
};

export default async function ComposerPage({ params }: ComposerPageProps) {
  const { entryId } = await params;

  return (
    <main className="shell">
      <section className="week-two route-surface" aria-labelledby="composer-title">
        <div className="week-two-header">
          <div>
            <p>Scrapbook canvas</p>
            <h1 id="composer-title">Memory Composer</h1>
          </div>
          <Link className="text-link" href="/forest">
            Return to forest
          </Link>
        </div>
        <p className="status-line">Editing fictional entry {entryId}.</p>
        <MemoryComposer entryId={entryId} />
      </section>
    </main>
  );
}
