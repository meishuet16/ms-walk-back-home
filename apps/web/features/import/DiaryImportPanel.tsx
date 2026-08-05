type DiaryImportPanelProps = {
  rawImportText: string;
  setRawImportText: (value: string) => void;
  parseCurrentText: () => void;
  importDiaryFile: (file: File) => Promise<void>;
};

export function DiaryImportPanel({
  rawImportText,
  setRawImportText,
  parseCurrentText,
  importDiaryFile
}: DiaryImportPanelProps) {
  return (
    <div className="panel import-panel">
      <h3>Diary Import</h3>
      <textarea
        aria-label="Paste multi-entry diary text"
        value={rawImportText}
        onChange={(event) => setRawImportText(event.target.value)}
      />
      <div className="control-row">
        <button type="button" onClick={parseCurrentText}>
          Parse Text
        </button>
        <label className="file-button">
          TXT / MD
          <input
            accept=".txt,.md,text/plain,text/markdown"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void importDiaryFile(file);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
