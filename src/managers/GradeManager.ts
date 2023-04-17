import { Grade, GradeSchema } from "../structures/Grade";
import { BaseManager } from "./BaseManager";
import { z } from "zod";

export class GradeManager extends BaseManager {
  cache: Map<number, Grade> = new Map<number, Grade>();

  async fetch(id: number): Promise<Grade> {
    const gradeSchema = z.object({
      Grade: GradeSchema
    })

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const grade = await this.client.request(gradeSchema, `https://api.librus.pl/3.0/Grades/${id}`);

    this.cache.set(id, new Grade(grade.Grade, this.client));
    await this.client.gradeCategories.fetch(grade.Grade.Category.Id);
    await this.client.users.fetchManyFromResources([grade.Grade.AddedBy, grade.Grade.Student]);
    await this.client.subjects.fetch(grade.Grade.Subject.Id);

    return new Grade(grade.Grade, this.client);
  }

  async fetchAll(): Promise<Grade[]> {
    const gradesSchema = z.object({
      Grades: z.array(GradeSchema)
    });

    const grades = await this.client.request(gradesSchema, "https://api.librus.pl/3.0/Grades/");
    await this.client.gradeCategories.fetchManyFromResources(grades.Grades.map(grade => grade.Category));

    await this.client.users.fetchManyFromResources(grades.Grades.map(grade => grade.AddedBy));
    await this.client.users.fetchManyFromResources(grades.Grades.map(grade => grade.Student));
    await this.client.subjects.fetchManyFromResources(grades.Grades.map(grade => grade.Subject));

    return grades.Grades.map(grade => {
      this.cache.set(grade.Id, new Grade(grade, this.client));
      return new Grade(grade, this.client);
    });
  }
}