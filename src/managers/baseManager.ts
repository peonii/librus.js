import { LibrusClient } from "../client/LibrusClient";

/**
 * Base manager class for all managers
 * 
 * @abstract
 */
export class BaseManager {
  client: LibrusClient;

  constructor(client: LibrusClient) {
    this.client = client;
  }
}