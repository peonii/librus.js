import { z } from "zod";
import { NumberIDResource, NumberIDResourceSchema } from "./NumberIDResource";
import { LibrusClient } from "../client/LibrusClient";
import { User } from "./User";
import { Color } from "./Color";

export const GradeCategorySchema = z.object({
  Id: z.number(),
  Color: NumberIDResourceSchema,
  Name: z.string(),
  AdultsExtramural: z.boolean(),
  AdultsDaily: z.boolean(),
  Standard: z.boolean(),
  IsReadOnly: z.string(),
  CountToTheAverage: z.boolean(),
  Weight: z.number().optional(),
  BlockAnyGrades: z.boolean(),
  ObligationToPerform: z.boolean(),
  IsSemestral: z.boolean().optional(),
  IsSemestralProposition: z.boolean().optional(),
  Short: z.string().optional(),
  Teacher: z.optional(NumberIDResourceSchema),
});

export type GradeCategoryPartial = z.infer<typeof GradeCategorySchema>;

export class GradeCategory {
  id: number;
  name: string;
  adultsExtramural: boolean;
  adultsDaily: boolean;
  standard: boolean;
  isReadOnly: string;
  countToTheAverage: boolean;
  weight: number | null;
  blockAnyGrades: boolean;
  obligationToPerform: boolean;
  isSemestral: boolean | null;
  isSemestralProposition: boolean | null;
  short: string | null;

  colorResource: NumberIDResource;
  teacherResource: NumberIDResource | null;

  client: LibrusClient;

  constructor(data: GradeCategoryPartial, client: LibrusClient) {
    this.id = data.Id;
    this.name = data.Name;
    this.adultsExtramural = data.AdultsExtramural;
    this.adultsDaily = data.AdultsDaily;
    this.standard = data.Standard;
    this.isReadOnly = data.IsReadOnly;
    this.countToTheAverage = data.CountToTheAverage;
    this.weight = data.Weight ?? null;
    this.blockAnyGrades = data.BlockAnyGrades;
    this.obligationToPerform = data.ObligationToPerform;
    this.isSemestral = data.IsSemestral ?? null;
    this.isSemestralProposition = data.IsSemestralProposition ?? null;
    this.short = data.Short ?? null;

    this.colorResource = data.Color;
    this.teacherResource = data.Teacher ?? null;

    this.client = client;
  }

  get teacher(): User | undefined {
    if (!this.teacherResource) return undefined;
    return this.client.users._getFromCache(this.teacherResource.Id.toString());
  }

  get color(): Color {
    return this.client.colors._getFromCache(this.colorResource.Id);
  }

  async fetchColor(): Promise<Color> {
    return await this.client.colors.fetch(this.colorResource.Id);
  }

  async fetchTeacher(): Promise<User | null> {
    if (!this.teacherResource) return null;
    return await this.client.users.fetch(this.teacherResource.Id);
  }
}