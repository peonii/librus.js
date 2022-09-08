import { Response } from "node-fetch"
import LibrusClient from "../client/LibrusClient"
import { APISchoolNotice, APISchoolNotices, BaseFetchOptions, SchoolNotice } from "../types/api-types"
import BaseManager from "./baseManager"

export default class NoticeManager extends BaseManager {
    cache: Map<string, SchoolNotice>
    constructor(client: LibrusClient) {
        super(client)
        this.cache = new Map<string, SchoolNotice>()
    }

    async fetchAll(): Promise<SchoolNotice[]> {
        const response = await this.client.request('https://api.librus.pl/3.0/SchoolNotices/') as Response
        if (!response.ok) {
            throw new Error('something went wrong lmao')
        }
        const responseJSON = (await response.json() as APISchoolNotices).SchoolNotices
        return responseJSON
    }
    
    async fetch(id: string, options: BaseFetchOptions = {}): Promise<SchoolNotice> {
        options = this.resetFetchOptions(options)

        if (!options.force && this.cache.has(id)) {
            const cached = this.cache.get(id)
            if (cached) return cached
            else throw new Error('how did you even get here')
        }

        const res = await this.client.request(`https://api.librus.pl/3.0/SchoolNotices/${id}`) as Response

        if (!res.ok) throw new Error('okay no')

        const noticeJSON = (await res.json() as APISchoolNotice).SchoolNotice
        if (options.cache) this.cache.set(id, noticeJSON) // cache the notice
        return noticeJSON
    }
}