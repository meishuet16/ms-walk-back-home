import type { ImportDraftEntry, MemoryGraphRecord } from "@walk/shared";

type ImportReviewPanelProps = {
  drafts: ImportDraftEntry[];
  confirmedCount: number;
  graphRecords: MemoryGraphRecord[];
  confirmImport: () => Promise<void>;
  updateDraftById: (id: string, patch: Partial<Pick<ImportDraftEntry, "entryDate" | "title" | "body" | "weather">>) => void;
  mergeDraft: (id: string) => void;
  splitDraftById: (id: string) => void;
  removeDraftById: (id: string) => void;
};

export function ImportReviewPanel({
  confirmedCount,
  confirmImport,
  drafts,
  graphRecords,
  mergeDraft,
  removeDraftById,
  splitDraftById,
  updateDraftById
}: ImportReviewPanelProps) {
  return (
    <div className="panel review-panel">
      <div className="review-heading">
        <h3>Import Review</h3>
        <button type="button" onClick={() => void confirmImport()}>
          Confirm Import
        </button>
      </div>
      {confirmedCount > 0 ? (
        <p className="status-line">{confirmedCount} fictional entries saved to runtime storage.</p>
      ) : null}
      {graphRecords.length > 0 ? (
        <div className="graph-status-list">
          {graphRecords.map((record) => (
            <p className="status-line" key={record.entryId}>
              {record.entryId}: {record.state}
              {record.errors.length > 0 ? ` (${record.errors.join("; ")})` : ""}
            </p>
          ))}
        </div>
      ) : null}
      <div className="draft-list">
        {drafts.map((draft, index) => (
          <article className="draft-card" key={draft.id}>
            <div className="draft-fields">
              <input
                aria-label={`Date for ${draft.id}`}
                value={draft.entryDate}
                onChange={(event) => updateDraftById(draft.id, { entryDate: event.target.value })}
                placeholder="YYYY-MM-DD"
              />
              <input
                aria-label={`Title for ${draft.id}`}
                value={draft.title}
                onChange={(event) => updateDraftById(draft.id, { title: event.target.value })}
              />
            </div>
            <p>{draft.body.slice(0, 180) || "No body yet."}</p>
            <div className="draft-meta">
              <span>confidence {Math.round(draft.confidence * 100)}%</span>
              {draft.warnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </div>
            <div className="control-row">
              <button type="button" onClick={() => mergeDraft(draft.id)}>
                Merge Next
              </button>
              <button type="button" onClick={() => splitDraftById(draft.id)}>
                Split
              </button>
              <button type="button" onClick={() => removeDraftById(draft.id)}>
                Remove
              </button>
            </div>
            <small>Draft {index + 1}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
