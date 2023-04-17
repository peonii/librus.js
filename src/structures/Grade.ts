import { z } from "zod";
import { NumberIDResource, NumberIDResourceSchema } from "./NumberIDResource";
import { LibrusClient } from "../client/LibrusClient";
import { User } from "./User";
import { GradeCategory } from "./GradeCategory";
import { Subject } from "./Subject";

export const GradeSchema = z.object({
  Id: z.number(),
  Lesson: NumberIDResourceSchema,
  Subject: NumberIDResourceSchema,
  Student: NumberIDResourceSchema,
  Category: NumberIDResourceSchema,
  AddedBy: NumberIDResourceSchema,
  Grade: z.string(),
  Date: z.string(),
  AddDate: z.string(),
  Semester: z.number(),
  IsConstituent: z.boolean(),
  IsSemester: z.boolean(),
  IsSemesterProposition: z.boolean(),
  IsFinal: z.boolean(),
  IsFinalProposition: z.boolean(),
  Comments: z.array(NumberIDResourceSchema).optional(),
  Improvement: NumberIDResourceSchema.optional(),
  Resit: z.optional(NumberIDResourceSchema),
});

export type GradePartial = z.infer<typeof GradeSchema>;

export class Grade {
  id: number;
  grade: string;
  date: string;
  addDate: string;
  semester: number;
  isConstituent: boolean;
  isSemester: boolean;
  isSemesterProposition: boolean;
  isFinal: boolean;
  isFinalProposition: boolean;

  lessonResource: NumberIDResource;
  subjectResource: NumberIDResource;
  studentResource: NumberIDResource;
  categoryResource: NumberIDResource;
  addedByResource: NumberIDResource;
  commentsResources: NumberIDResource[] | undefined;
  improvementResource: NumberIDResource | undefined;
  resitResource: NumberIDResource | undefined;

  client: LibrusClient;

  constructor(data: GradePartial, client: LibrusClient) {
    this.id = data.Id;
    this.grade = data.Grade;
    this.date = data.Date;
    this.addDate = data.AddDate;
    this.semester = data.Semester;
    this.isConstituent = data.IsConstituent;
    this.isSemester = data.IsSemester;
    this.isSemesterProposition = data.IsSemesterProposition;
    this.isFinal = data.IsFinal;
    this.isFinalProposition = data.IsFinalProposition;

    this.lessonResource = data.Lesson;
    this.subjectResource = data.Subject;
    this.studentResource = data.Student;
    this.categoryResource = data.Category;
    this.addedByResource = data.AddedBy;
    this.commentsResources = data.Comments;
    this.improvementResource = data.Improvement;
    this.resitResource = data.Resit;

    this.client = client;
  }

  get addedBy(): User {
    return this.client.users._getFromCache(this.addedByResource.Id.toString());
  }

  get subject(): Subject {
    return this.client.subjects._getFromCache(this.subjectResource.Id);
  }

  get student(): User {
    return this.client.users._getFromCache(this.studentResource.Id.toString());
  }

  get category(): GradeCategory {
    return this.client.gradeCategories._getFromCache(this.categoryResource.Id);
  }

  async fetchAddedBy(): Promise<User> {
    return await this.client.users.fetch(this.addedByResource.Id);
  }

  async fetchLesson(): Promise<string> {
    return "todo " + this.lessonResource.Id;
  }

  async fetchSubject(): Promise<Subject> {
    return await this.client.subjects.fetch(this.subjectResource.Id);
  }

  async fetchStudent(): Promise<User> {
    return await this.client.users.fetch(this.studentResource.Id);
  }

  async fetchCategory(): Promise<GradeCategory> {
    return await this.client.gradeCategories.fetch(this.categoryResource.Id);
  }

  async fetchComments(): Promise<string> {
    return "todo " + this.commentsResources?.map((r) => r.Id).join(", ");
  }

  async fetchImprovement(): Promise<string> {
    return "todo " + this.improvementResource?.Id;
  }

  async fetchResit(): Promise<string> {
    return "todo " + this.resitResource?.Id;
  }
}
