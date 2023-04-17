import { z } from "zod";
import { Subject, SubjectSchema, SubjectTransformer } from "../structures/Subject";
import { BaseManager } from "./BaseManager";
import { NumberIDResource } from "../structures/NumberIDResource";

export class SubjectManager extends BaseManager {
  cache: Map<number, Subject> = new Map<number, Subject>();

  async fetch(id: number): Promise<Subject> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const subjectSchema = z.object({
      Subject: SubjectSchema
    })

    const subject = await this.client.request(subjectSchema, "https://api.librus.pl/3.0/Subjects/" + id);

    const transformedSubject = SubjectTransformer.parse(subject.Subject);

    this.cache.set(id, transformedSubject);

    return transformedSubject;
  }

  _getFromCache(id: number): Subject {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    throw new Error("Subject not found in cache");
  }

  async fetchManyFromResources(resources: NumberIDResource[]): Promise<Subject[]> {
    const subjects = resources.map(res => res.Id).join(",");

    const subjectSchema = z.object({
      Subjects: z.array(SubjectSchema)
    });

    const subjectsData = await this.client.request(subjectSchema, `https://api.librus.pl/3.0/Subjects/${subjects}`);

    return subjectsData.Subjects.map(subject => {
      this.cache.set(subject.Id, SubjectTransformer.parse(subject));
      return SubjectTransformer.parse(subject);
    });
  }
}