import fetchCookie from "fetch-cookie";
import { z } from "zod";
import { NumberIDResourceSchema } from "../structures/NumberIDResource";
import { NoticeManager } from "../managers/NoticeManager";
import { UserManager } from "../managers/UserManager";
import { GradeCategoryManager } from "../managers/GradeCategoryManager";
import { GradeManager } from "../managers/GradeManager";
import { SubjectManager } from "../managers/SubjectManager";
import { ColorManager } from "../managers/ColorManager";

const accountInfoSchema = z.object({
  Id: z.number(),
  UserId: z.number(),
  FirstName: z.string(),
  LastName: z.string(),
  Email: z.string().email(),
  GroupId: z.number().optional(),
  IsActive: z.boolean(),
  Login: z.string(),
  IsPremium: z.boolean(),
  IsPremiumDemo: z.boolean(),
  ExpiredPremiumDate: z.number()
});

export class LibrusClient {
  private bearerToken = "";
  private synergiaLogin = "";

  private appUsername = "";
  private appPassword = "";

  private loggedIn = false;

  private cookieFetch = fetchCookie(fetch);

  /**
   * ID of the device that is registered to receive push notifications.
   */
  public pushDevice = 0;

  /**
   * Public information about the account.
   * 
   * This is `null` until the `login` method is called.
   * 
   * @example
   * ```ts
   * const client = new LibrusClient();
   * await client.login("john.doe@email.com", "password");
   * 
   * console.log(client.publicInfo);
   * ```
   */
  public publicInfo: z.infer<typeof accountInfoSchema> | null = null;

  public notices: NoticeManager = new NoticeManager(this);
  public users: UserManager = new UserManager(this);
  public grades: GradeManager = new GradeManager(this);
  public gradeCategories: GradeCategoryManager = new GradeCategoryManager(this);
  public subjects: SubjectManager = new SubjectManager(this);
  public colors: ColorManager = new ColorManager(this);

  constructor() {}

  /**
   * Log in to the Librus system using the provided credentials.
   * @async
   * @param username Email address of the user.
   * @param password Password of the user.
   * @example
   * ```ts
   * const client = new LibrusClient();
   * await client.login("john.doe@email.com", "password");
   * ```
   * 
   * @throws If the login fails.
   **/
  async login(username: string, password: string) {
    const credentialsSchema = z.object({
      email: z.string().email(),
      password: z.string().nonempty()
    })

    const credentials = credentialsSchema.parse({ email: username, password: password })
    const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36";

    const csrfTextRaw = await (await this.cookieFetch("https://portal.librus.pl/")).text();
    const csrfText = /<meta name="csrf-token" content="(.*)">/.exec(csrfTextRaw);

    if (!csrfText) {
      throw new Error("Could not find CSRF token.");
    }

    const csrfToken = csrfText[1];
    if (!csrfToken) {
      throw new Error("Could not find CSRF token.");
    }

    const loginResponse = await this.cookieFetch("https://portal.librus.pl/konto-librus/login/action", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken
      },
      body: JSON.stringify(credentials)
    });

    if (!loginResponse.ok) throw new Error("Initial login request failed.");

    const accountsResponse = await this.cookieFetch("https://portal.librus.pl/api/v3/SynergiaAccounts", {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
      }
    })

    if (!accountsResponse.ok) throw new Error("Could not get accounts.");

    const accountsResponseSchema = z.object({
      lastModification: z.number(),
      accounts: z.array(z.object({
        id: z.number(),
        accountIdentifier: z.string(),
        group: z.string(),
        accessToken: z.string(),
        login: z.string(),
        studentName: z.string(),
        scopes: z.string(),
        state: z.string(),
      })).nonempty()
    })

    const accounts = accountsResponseSchema.parse(await accountsResponse.json());

    this.bearerToken = accounts.accounts[0].accessToken;
    this.synergiaLogin = accounts.accounts[0].login;
    this.appUsername = username;
    this.appPassword = password;

    const librusMeSchema = z.object({
      Me: z.object({
        Account: accountInfoSchema,
        User: z.object({
          FirstName: z.string(),
          LastName: z.string(),
        }),
        Refresh: z.number(),
        Class: NumberIDResourceSchema
      })
    });

    this.loggedIn = true;

    const librusMeRequest = await this.request(librusMeSchema, "https://api.librus.pl/3.0/Me");

    this.publicInfo = librusMeRequest.Me.Account;
  }

  /**
   * Refresh the bearer token.
   * 
   * @async
   * 
   * @throws If the token could not be refreshed.
   * 
   * @example
   * ```ts
   * const client = new LibrusClient();
   * 
   * await client.login("john.doe@email.com", "password");
   * 
   * // ...
   * 
   * // Oh no, the token expired!
   * await client.refreshToken();
   * 
   * // Now we can continue using the client.
   * ```
   */
  async refreshToken() {
    if (!this.loggedIn) throw new Error("Not logged in.");

    const tokenResponse = await this.cookieFetch(`https://portal.librus.pl/api/v3/SynergiaAccounts/fresh/${this.synergiaLogin}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
      },
      redirect: "manual"
    })

    if (!tokenResponse.ok) throw new Error("Could not refresh token.");

    const tokenResponseSchema = z.object({
      accessToken: z.string(),
    });

    const token = tokenResponseSchema.parse(await tokenResponse.json());

    this.bearerToken = token.accessToken;
  }

  /**
   * Make a request to the Librus API using cached credentials.
   * 
   * @async
   * 
   * @param schema Zod schema to validate the response against.
   * @param url URL to request.
   * @returns Parsed response inferred from the provided schema.
   * 
   * @throws If the request fails or if the response does not match the provided schema.
   * 
   * @example
   * ```ts
   * const client = new LibrusClient();
   * await client.login("john.doe@email.com", "password");
   * 
   * const schema = z.object({
   *  id: z.number(),
   * })
   * 
   * await client.request(schema, "https://url.com/api/id");
   * ```
   */
  async request<T extends z.ZodTypeAny>(schema: T, url: string): Promise<z.infer<T>> {
    if (!this.loggedIn) throw new Error("Not logged in.");

    const urlValidated = z.string().url().parse(url);

    const options: RequestInit = {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        gzip: "true",
        Authorization: `Bearer ${this.bearerToken}`
      },
      redirect: "manual"
    }

    let response = await this.cookieFetch(urlValidated, options);

    if (response.status === 401) {
      try {
        await this.refreshToken();
      } catch (e) {
        // Try to log in again fully.
        await this.login(this.appUsername, this.appPassword);
      }

      (options.headers as {[key: string]: string}).Authorization = `Bearer ${this.bearerToken}`;
      let response = await this.cookieFetch(urlValidated, options);

      if (!response.ok) throw new Error("Request failed.");
    }

    console.log('Fetched ' + urlValidated);

    return schema.parse(await response.json());
  }
}