import { z } from "zod";
import { NumberIDResource, NumberIDResourceSchema } from "./NumberIDResource";
import { LibrusClient } from "../client/LibrusClient";
import { User } from "./User";

export const LessonSchema = z.object({
  Id: z.number(),
  Teacher: NumberIDResourceSchema,
  Subject: NumberIDResourceSchema,
})

export type LessonPartial = z.infer<typeof LessonSchema>;

export class Lesson {
  id: number;
  teacherResource: NumberIDResource;
  subjectResource: NumberIDResource;

  client: LibrusClient;

  constructor(data: LessonPartial, client: LibrusClient) {
    this.id = data.Id;
    this.teacherResource = data.Teacher;
    this.subjectResource = data.Subject;
    this.client = client;
  }

  async fetchTeacher(): Promise<User> {
    return await this.client.users.fetch(this.teacherResource.Id);
  }

  async fetchSubject(): Promise<string> {
    return "todo " + this.subjectResource.Url;
  }
}