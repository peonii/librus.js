import { z } from "zod";

export const ColorSchema = z.object({
  Id: z.number(),
  RGB: z.string(),
  Name: z.string(),
})

export type ColorPartial = z.infer<typeof ColorSchema>;

export const ColorTransformer = ColorSchema.transform((data) => {
  return {
    id: data.Id,
    rgb: data.RGB,
    name: data.Name,
  }
})

export type Color = z.infer<typeof ColorTransformer>;