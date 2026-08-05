"use client";

import { MemoryComposer } from "../features/composer/MemoryComposer";
import { DiaryImportPanel } from "../features/import/DiaryImportPanel";
import { ImportReviewPanel } from "../features/import/ImportReviewPanel";
import { useDiaryImport } from "../features/import/useDiaryImport";

export function ImportComposerWorkspace() {
  const diaryImport = useDiaryImport();

  return (
    <section className="week-two" aria-labelledby="week-two-title">
      <div className="week-two-header">
        <div>
          <p>Week 2 fixture workspace</p>
          <h2 id="week-two-title">Import Review + Memory Composer</h2>
        </div>
        <span>Fixture mode · no paid APIs</span>
      </div>

      <div className="week-two-grid">
        <DiaryImportPanel
          importDiaryFile={diaryImport.importDiaryFile}
          parseCurrentText={diaryImport.parseCurrentText}
          rawImportText={diaryImport.rawImportText}
          setRawImportText={diaryImport.setRawImportText}
        />
        <ImportReviewPanel
          confirmedCount={diaryImport.confirmedCount}
          confirmImport={diaryImport.confirmImport}
          drafts={diaryImport.drafts}
          graphRecords={diaryImport.graphRecords}
          mergeDraft={diaryImport.mergeDraft}
          removeDraftById={diaryImport.removeDraftById}
          splitDraftById={diaryImport.splitDraftById}
          updateDraftById={diaryImport.updateDraftById}
        />
        <MemoryComposer />
      </div>
    </section>
  );
}
