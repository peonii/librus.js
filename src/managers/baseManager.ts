import type LibrusClient from "../client/LibrusClient";
import type { BaseFetchOptions } from "../types/api-types";

export default class BaseManager {
    client: LibrusClient
    constructor(client: LibrusClient) {
        this.client = client
    }
    resetFetchOptions(options: BaseFetchOptions): BaseFetchOptions {
        const defaultFetchOptions = {
            force: false,
            cache: true
        }
        return { ...defaultFetchOptions, ...options }
    }
}