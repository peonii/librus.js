import { z } from "zod";

export const NumberIDResourceSchema = z.object({
  Id: z.number(),
  Url: z.string().url(),
});

export type NumberIDResource = z.infer<typeof NumberIDResourceSchema>;