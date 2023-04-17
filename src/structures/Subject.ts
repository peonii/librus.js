import { z } from "zod";

export const SubjectSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  No: z.number(),
  Short: z.string(),
  IsExtracurricular: z.boolean(),
  IsBlockLesson: z.boolean()
});

export type SubjectPartial = z.infer<typeof SubjectSchema>;

export const SubjectTransformer = SubjectSchema.transform((data) => {
  return {
    id: data.Id,
    name: data.Name,
    no: data.No,
    short: data.Short,
    isExtracurricular: data.IsExtracurricular,
    isBlockLesson: data.IsBlockLesson
  }
})

export type Subject = z.infer<typeof SubjectTransformer>;