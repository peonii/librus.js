export interface ResourcesResource {
    Url: string
}

export interface NumberIDResource {
    Id: number
    Url: string
}

export interface PushChangeResource {
    Id: string
    Type: string
    Url: string
}

export interface BaseFetchOptions {
    force?: boolean
    cache?: boolean
}

export interface PushChange {
    Id: number
    Resource: PushChangeResource
    Type: string
    AddDate: string
    extraData: string | null
}

export interface APIv3BaseResponse {
    Resources?: {
        [path: string]: ResourcesResource
    }
    Url?: string
    Status?: string
    Code?: string
    Message?: string
    MessagePL?: string
}

export interface APIPushChanges extends APIv3BaseResponse {
    Changes: PushChange[]
    ChangesTimestamp: number
}

export interface APISynergiaAccount {
    id: number
    accountIdentifier: string
    group: string
    token: string
    login: string 
    studentName: string
    scopes: string
    state: string
}

export interface APISynergiaAccountsWrapper {
    lastModification: number
    accounts: APISynergiaAccount[]
}

export interface PostAPIChangeRegister extends APIv3BaseResponse {
    ChangeRegister: NumberIDResource
}