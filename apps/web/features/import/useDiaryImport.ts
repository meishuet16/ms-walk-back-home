import {
  confirmImportDrafts,
  createFixtureDiaryParser,
  createInMemoryConfirmedDiaryRepository,
  createInMemoryMemoryGraphRepository,
  fictionalMultiEntryImport,
  mergeAdjacentDrafts,
  parseDiaryImport,
  removeDraft,
  splitDraft,
  updateDraft,
  type ImportDraftEntry,
  type MemoryGraphRecord
} from "@walk/shared";
import { useMemo, useRef, useState } from "react";
import { createLocalDiaryImportRuntimeStorage } from "./runtime-storage";

export function useDiaryImport() {
  const [rawImportText, setRawImportText] = useState(fictionalMultiEntryImport);
  const [drafts, setDrafts] = useState<ImportDraftEntry[]>(() => parseDiaryImport(fictionalMultiEntryImport).drafts);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [graphRecords, setGraphRecords] = useState<MemoryGraphRecord[]>([]);
  const confirmedRepository = useRef(createInMemoryConfirmedDiaryRepository());
  const graphRepository = useRef(createInMemoryMemoryGraphRepository());
  const parser = useRef(createFixtureDiaryParser());
  const runtimeStorage = useMemo(
    () => (typeof window === "undefined" ? null : createLocalDiaryImportRuntimeStorage(window.localStorage)),
    []
  );

  function parseCurrentText() {
    setDrafts(parseDiaryImport(rawImportText).drafts);
  }

  async function importDiaryFile(file: File) {
    const text = await file.text();
    setRawImportText(text);
    setDrafts(parseDiaryImport(text).drafts);
  }

  async function confirmImport() {
    const confirmedInputs = confirmImportDrafts(drafts);
    const savedEntries = await confirmedRepository.current.saveMany(confirmedInputs);
    runtimeStorage?.saveConfirmedEntries(savedEntries);
    runtimeStorage?.saveConfirmedRawImport(rawImportText);
    setConfirmedCount(savedEntries.length);

    for (const entry of savedEntries) {
      await graphRepository.current.setState(entry.id, "processing");
      const parsed = await parser.current.parse(entry);
      if (parsed.state === "playable") {
        await graphRepository.current.saveGraph(parsed.graph);
      } else {
        await graphRepository.current.setState(entry.id, "failed", parsed.errors);
      }
    }

    const records = await graphRepository.current.list();
    runtimeStorage?.saveMemoryGraphRecords(records);
    setGraphRecords(records);
  }

  return {
    rawImportText,
    setRawImportText,
    drafts,
    confirmedCount,
    graphRecords,
    parseCurrentText,
    importDiaryFile,
    confirmImport,
    updateDraftById(id: string, patch: Partial<Pick<ImportDraftEntry, "entryDate" | "title" | "body" | "weather">>) {
      setDrafts((current) => updateDraft(current, id, patch));
    },
    mergeDraft(id: string) {
      setDrafts((current) => mergeAdjacentDrafts(current, id));
    },
    splitDraftById(id: string) {
      setDrafts((current) => splitDraft(current, id, 1));
    },
    removeDraftById(id: string) {
      setDrafts((current) => removeDraft(current, id));
    }
  };
}
