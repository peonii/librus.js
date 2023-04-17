import { z } from "zod";
import { LibrusClient } from "../client/LibrusClient";
import { User, UserSchema, UserTransformer } from "../structures/User";
import { BaseManager } from "./BaseManager";

export class UserManager extends BaseManager {
  cache: Map<string, User> = new Map<string, User>();

  constructor(client: LibrusClient) {
    super(client);
  }

  async fetch(id: number): Promise<User> {
    if (this.cache.has(id.toString())) {
      return this.cache.get(id.toString())!;
    }

    const userSchema = z.object({
      User: UserSchema
    });

    const user = await this.client.request(userSchema, "https://api.librus.pl/3.0/Users/" + id);

    const transformedUser = UserTransformer.parse(user.User);

    this.cache.set(id.toString(), transformedUser);

    return transformedUser;
  }

  /**
   * **For internal use only.**
   * Fetch a user from the cache
   *  
   * @param id ID of the user to fetch
   * @returns The user with the given ID
   */
  _getFromCache(id: string): User {
    return this.cache.get(id)!;
  }

  async fetchManyFromResources(resources: { Id: number }[]): Promise<User[]> {
    const users = resources.map(res => res.Id).join(",");

    const userSchema = z.object({
      Users: z.array(UserSchema)
    });

    const usersData = await this.client.request(userSchema, `https://api.librus.pl/3.0/Users/${users}`);

    return usersData.Users.map(user => {
      this.cache.set(user.Id.toString(), UserTransformer.parse(user));
      return UserTransformer.parse(user);
    });
  }
}