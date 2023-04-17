import { z } from "zod";
import { LibrusClient } from "../client/LibrusClient";
import { BaseManager } from "./BaseManager";
import { SchoolNoticePartial, SchoolNoticeSchema, SchoolNotice } from "../structures/SchoolNotice";

/**
 * Notice manager class
 */
export class NoticeManager extends BaseManager {
  cache: Map<string, SchoolNoticePartial> = new Map<string, SchoolNoticePartial>();

  constructor(client: LibrusClient) {
    super(client);
  }

  async fetchAll(): Promise<SchoolNotice[]> {
    const noticesSchema = z.object({
      SchoolNotices: z.array(SchoolNoticeSchema)
    });

    const notices = await this.client.request(noticesSchema, "https://api.librus.pl/3.0/SchoolNotices/");

    return notices.SchoolNotices.map(notice => {
      this.cache.set(notice.Id, notice);
      return new SchoolNotice(notice, this.client);
    });
  }

  async fetch(id: string): Promise<SchoolNotice> {
    const noticeSchema = z.object({
      SchoolNotice: SchoolNoticeSchema
    });

    if (this.cache.has(id)) {
      return new SchoolNotice(this.cache.get(id)!, this.client);
    }

    const notice = await this.client.request(noticeSchema, `https://api.librus.pl/3.0/SchoolNotices/${id}`);

    this.cache.set(id, notice.SchoolNotice);

    return new SchoolNotice(notice.SchoolNotice, this.client);
  }
}