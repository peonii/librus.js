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
    accessToken: string
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

export interface SchoolNotice {
    Id: string
    StartDate: string;
	EndDate: string;
	Subject: string;
	Content: string;
	AddedBy: NumberIDResource
	CreationDate: string;
	WasRead: boolean;
}

export interface APISchoolNotice extends APIv3BaseResponse {
    SchoolNotice: SchoolNotice
}

export interface APISchoolNotices extends APIv3BaseResponse {
    SchoolNotices: SchoolNotice[]
}

export interface User {
    Id: number
    AccountID: number
    FirstName: string
    LastName: string
    IsEmployee: boolean
    GroupId?: number
}

export interface APIUser extends APIv3BaseResponse {
    User: User
}

export interface APIUsers extends APIv3BaseResponse {
    Users: User[]
}

export interface LibrusAccountInfo {
    Id: number
    UserId: number
    FirstName: string
    LastName: string
    Email: string
    GroupId?: number // what is this
    IsActive: boolean
    Login: string
    IsPremium: boolean
    IsPremiumDemo: boolean
    ExpiredPremiumDate: number
}

export interface LibrusRealName {
    FirstName: string
    LastName: string
}

export interface LibrusMe {
    Account: LibrusAccountInfo
    User: LibrusRealName
    Refresh: number
    Class: NumberIDResource
}

export interface APIMe extends APIv3BaseResponse {
    Me: LibrusMe
}

export interface LibrusUserClass {
    Id: number
    Number: number 
    Symbol: string
    BeginSchoolYear: string
    EndFirstSemester: string
    EndSchoolYear: string
    Unit: NumberIDResource
    ClassTutor: NumberIDResource
    ClassTutors: NumberIDResource[]
}

export interface APIClasses extends APIv3BaseResponse {
    Class: LibrusUserClass
}