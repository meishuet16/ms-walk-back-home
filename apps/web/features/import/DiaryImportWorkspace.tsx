"use client";

import Link from "next/link";
import { DiaryImportPanel } from "./DiaryImportPanel";
import { ImportReviewPanel } from "./ImportReviewPanel";
import { useDiaryImport } from "./useDiaryImport";

export function DiaryImportWorkspace() {
  const diaryImport = useDiaryImport();

  return (
    <section className="week-two route-surface" aria-labelledby="import-title">
      <div className="week-two-header">
        <div>
          <p>Fixture import</p>
          <h1 id="import-title">Diary Import</h1>
        </div>
        <Link className="text-link" href="/forest">
          Return to forest
        </Link>
      </div>

      <div className="week-two-grid import-route-grid">
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
          portalManifest={diaryImport.portalManifest}
          removeDraftById={diaryImport.removeDraftById}
          splitDraftById={diaryImport.splitDraftById}
          updateDraftById={diaryImport.updateDraftById}
        />
      </div>
    </section>
  );
}
