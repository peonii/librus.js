import { z } from "zod";
import { NumberIDResource, NumberIDResourceSchema } from "./NumberIDResource";
import { User } from "./User";
import { LibrusClient } from "../client/LibrusClient";

export const SchoolNoticeSchema = z.object({
  Id: z.string(),
  StartDate: z.string(),
  EndDate: z.string(),
  Subject: z.string(),
  Content: z.string(),
  AddedBy: NumberIDResourceSchema,
  CreationDate: z.string(),
  WasRead: z.boolean(),
})

export type SchoolNoticePartial = z.infer<typeof SchoolNoticeSchema>;

export class SchoolNotice {
  id: string;
  startDate: string;
  endDate: string;
  subject: string;
  content: string;
  creationDate: string;
  wasRead: boolean;
  addedByResource: NumberIDResource;
  client: LibrusClient;

  constructor(data: SchoolNoticePartial, client: LibrusClient) {
    this.id = data.Id;
    this.startDate = data.StartDate;
    this.endDate = data.EndDate;
    this.subject = data.Subject;
    this.content = data.Content;
    this.creationDate = data.CreationDate;
    this.wasRead = data.WasRead;
    this.addedByResource = data.AddedBy;
    this.client = client;
  }

  async fetchAddedBy(): Promise<User> {
    return await this.client.users.fetch(this.addedByResource.Id);
  }
}