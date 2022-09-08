import fetchCookie from 'fetch-cookie';
import fetch from 'cross-fetch';
import type { APIMe, APIPushChanges, APISynergiaAccountsWrapper, LibrusAccountInfo, PostAPIChangeRegister } from '../types/api-types';


interface LibrusClientRequestOptions {
    fetchOptions?: RequestInit 
    response?: "text" | "json" | "raw"
}

export class LibrusClient {
    private bearerToken: string;
    pushDevice: number;
    private synergiaLogin: string;
    private appUsername: string;
    private appPassword: string;
    private cookieFetch;
    publicInfo: LibrusAccountInfo | null

    constructor() {
        this.bearerToken = ""
        this.pushDevice = 0
        this.synergiaLogin = ""
        this.appUsername = ""
        this.appPassword = ""
        this.cookieFetch = fetchCookie(fetch, new fetchCookie.toughCookie.CookieJar())
        this.publicInfo = null
    }

    async login(username: string, password: string): Promise<void> {
        // Validate password
        if (password.length < 2 || username.length < 2) throw new Error("Invalid username or password")
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"

        // Get CSRF token for future requests
        const res = await this.cookieFetch('https://portal.librus.pl/')
        const resText = await res.text()
        const csrfTokenRegex = /<meta name="csrf-token" content="(.*)">/g.exec(resText)
        if (!csrfTokenRegex)
            throw new Error('Error authenticating the user! No csrf-token <meta> tag found in <head> of the site')
        
        const csrfToken = csrfTokenRegex[1]
        if (!csrfToken) return // this is likely unreachable, it's just to prevent typescript from screaming LOL

        // Get necessary cookies
        const loginResponse = await this.cookieFetch('https://portal.librus.pl/rodzina/login/action', {
            method: 'POST',
            body: JSON.stringify({
                email: username, password
            }),
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
                "User-Agent": userAgent
            }
        })

        if (!loginResponse.ok)
            throw new Error('Could not get the necessary cookies!')
        
        // Get the bearer token
        const accountsResponse = await this.cookieFetch("https://portal.librus.pl/api/v3/SynergiaAccounts", {
            method: "GET",
            headers: {
                "User-Agent": userAgent
            }
        })
        const accounts = await accountsResponse.json() as APISynergiaAccountsWrapper
        if (!accountsResponse.ok) throw new Error('Could not get the bearer token!')
        if (!accounts.accounts[0]?.accessToken || !accounts.accounts[0]?.login)
            throw new Error('Could not find the bearer token!')

        this.bearerToken = accounts.accounts[0]?.accessToken
        this.appUsername = username
        this.appPassword = password

        const sanityCheck = await this.request('https://api.librus.pl/3.0/Me') as Response

        const sanityCheckJSON = (await sanityCheck.json()) as APIMe

        this.publicInfo = sanityCheckJSON.Me.Account

        return
    }

    async refreshToken(): Promise<void> {
        const response = await this.cookieFetch(`https://portal.librus.pl/api/v3/SynergiaAccounts/fresh/${this.synergiaLogin}`,
            {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"
                },
                redirect: "manual"
            }
        )
        let responseText
        try {
            responseText = await response.text()
        } catch (err) {
            throw new Error("Failed to get response body for token refresh")
        }

        let responseJSON
        try {
            responseJSON = JSON.parse(responseText)
        } catch (err) {
            throw new Error("Body isn't JSON (token refresh)")
        }

        if (!response.ok)
            throw new Error("Response isn't ok (token refresh)")
        
        if (!responseJSON.accessToken)
            throw new Error("GET SynergiaAccounts returned unexpected JSON format")
        
        this.bearerToken = responseJSON.accessToken
        return
    }

    async request(url: string, options?: LibrusClientRequestOptions): Promise<unknown> {
        let requestOptions: RequestInit = {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
                gzip: 'true',
                Authorization: 'Bearer ' + (this.bearerToken ? this.bearerToken : '')
            },
            redirect: "manual"
        }
        if (options?.fetchOptions) {
            requestOptions = {
                ...requestOptions,
                ...options.fetchOptions
            }

            if ("headers" in options.fetchOptions) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    ...options.fetchOptions.headers
                }
            }
        }

        let result = await this.cookieFetch(url, requestOptions)
        const clonedResult = result.clone()

        if (!result.ok) {
            if (result.status === 401) {
                try {
                    await this.refreshToken()
                } catch (err) {
                    await this.login(this.appUsername, this.appPassword)
                }

                (requestOptions.headers as {[key: string]: string}).Authorization = `Bearer ${this.bearerToken}`
                result = await this.cookieFetch(url, requestOptions)

                if (!result.ok) {
                    throw new Error("failed to request after reauth attempt")
                }
            }
        }

        return clonedResult
    }
    
    async newPushService(): Promise<number> {
        const response = await this.request("https://api.librus.pl/3.0/ChangeRegister", {
			fetchOptions: {
				method: "POST",
				body: JSON.stringify({
					sendPush: 0,
					appVersion: "6.0.0"
				})
			}
		}) as Response;

        const jsonResponse = await response.json() as PostAPIChangeRegister

        if (!jsonResponse.ChangeRegister?.Id) throw new Error("Post ChangeRegister returned unexpected JSON format")
        this.pushDevice = jsonResponse.ChangeRegister.Id
        return this.pushDevice
    }

    async getPushChanges(): Promise<APIPushChanges> {
        const response = await this.request(`https://api.librus.pl/3.0/PushChanges?pushDevice=${this.pushDevice}`) as Response;
        const responseJSON = await response.json() as APIPushChanges
        if (!response.ok)
            throw new Error("Unable to get push device (not 200)")
        
        if (responseJSON?.Code === "UnableToGetPushDevice")
            throw new Error("Unable to get push device - you're likely using a push device ID that's invalid or doesn't belong to you!")
        else if (responseJSON?.Code === "FilterInvalidValue")
            throw new Error("Invalid pushDevice ID")
        
        if (!("Changes" in responseJSON))
            throw new Error("No Changes array received in PushChanges")
        
        return responseJSON
    }

    async deletePushChanges(lastPushChanges: number[]): Promise<void> {
        if (!lastPushChanges.length) return
        while (lastPushChanges.length) {
            const delChanges = lastPushChanges.splice(0, 30).join(',')

            await this.request(`https://api.librus.pl/3.0/PushChanges/${delChanges}?pushDevice=${this.pushDevice}`, {
                fetchOptions: {
                    method: 'DELETE'
                }
            })
        }
    }
}
