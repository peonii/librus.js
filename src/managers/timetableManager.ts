import { LibrusClient } from "../client";
import { APITimetables, LibrusTimetableSlot } from "../types/api-types";
import { BaseManager } from "./baseManager";

export class TimetableManager extends BaseManager {
    constructor(client: LibrusClient) {
        super(client)
    }

    async fetchWeek(dayInWeek: string): Promise<APITimetables> {
        const weekStartDay = new Date(dayInWeek).getDate() - new Date(dayInWeek).getDay() + 1

        const weekStartDate = new Date(dayInWeek).setDate(weekStartDay)

        const res = await this.client.request(`https://api.librus.pl/3.0/Timetables?weekStart=${new Date(weekStartDate).toISOString().split('T')[0]}`) as Response

        console.log(res.url)

        if (!res.ok) throw new Error('uaaah')

        return (await res.json() as APITimetables)
    }

    async fetchDay(day: string): Promise<LibrusTimetableSlot> {
        const weekStartDay = new Date(day).getDate() - new Date(day).getDay()

        const weekStartDate = new Date(day).setDate(weekStartDay)

        const week = await this.fetchWeek(new Date(weekStartDate).toISOString().split('T')[0] || '')

        return week.Timetable[day] || []
    }
}