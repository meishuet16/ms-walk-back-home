import { z } from "zod";

export const DiaryEntrySchema = z.object({
  id: z.string().min(1),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  body: z.string(),
  mood: z.string().optional(),
  weather: z.string().optional(),
  privacyTag: z.literal("fictional"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const DiaryEntryInputSchema = DiaryEntrySchema.pick({
  entryDate: true,
  title: true,
  body: true,
  mood: true,
  weather: true
});

export const DiaryEntryPatchSchema = DiaryEntryInputSchema.partial();

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
export type DiaryEntryInput = z.infer<typeof DiaryEntryInputSchema>;
export type DiaryEntryPatch = z.infer<typeof DiaryEntryPatchSchema>;
