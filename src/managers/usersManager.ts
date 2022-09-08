import LibrusClient from "../client/LibrusClient";
import { APIUser, APIUsers, BaseFetchOptions, User } from "../types/api-types";
import BaseManager from "./baseManager";
import { Response } from "node-fetch";

export default class UsersManager extends BaseManager {
    cache: Map<number, User>
    constructor(client: LibrusClient) {
        super(client)
        this.cache = new Map<number, User>()
    }

    async fetch(id: number, options: BaseFetchOptions = {}): Promise<User> {
        options = this.resetFetchOptions(options)

        if (!options.force && this.cache.has(id)) {
            const cached = this.cache.get(id)
            if (cached) return cached
            else throw new Error('uaaaah') // unreachable
        }

        const res = await this.client.request(`https://api.librus.pl/3.0/Users/${id}`) as Response

        if (!res.ok) throw new Error('uaaah')
        
        const user = (await res.json() as APIUser).User

        if (options.cache)
            this.cache.set(id, user) // cache the user
        
        return user
    }

    async fetchMany(ids: number[], options: BaseFetchOptions = {}): Promise<User[]> {
        options = this.resetFetchOptions(options)

        const idCheckArray: number[] = []
        const returnArr: User[] = []

        if (!options.force) {
            for (const id of ids) {
                if (this.cache.has(id)) {
                    const cached = this.cache.get(id)
                    if (cached) returnArr.push(cached)
                }
                else {
                    idCheckArray.push(id)
                }
            }
        }
        else {
            for (const id of ids) {
                idCheckArray.push(id)
            }
        }

        while (idCheckArray.length > 0) {
            const joinedIds = idCheckArray.splice(0, 29).join(",");

            const res = await this.client.request(`https://api.librus.pl/3.0/Users/${joinedIds},`) as Response

            if (!res.ok) {
                throw new Error('okay...?')
            }

            const usersJSON = await res.json() as APIUsers
            
            for (const user of usersJSON.Users) {
                returnArr.push(user)
                if (options.cache)
                    this.cache.set(user.Id, user)
            }
        }
        return returnArr
    }
}