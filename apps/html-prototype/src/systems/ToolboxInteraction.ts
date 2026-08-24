export type ToolboxFieldChangeEffect = "draft-only" | "patch" | "remount";

export function toolboxFieldChangeEffect(field: string | undefined): ToolboxFieldChangeEffect {
  if (field === "spin-choice" || field === "spin-preset-name") return "draft-only";
  if (field === "spin-preset" || field === "pdf-files" || field === "media-file") return "patch";
  return "remount";
}
