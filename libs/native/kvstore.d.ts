declare module 'native/kvstore' {
  /**
   * Key-value store domain type
   */
  type KvStoreDomain = 'plugin';

  /**
   * Key-value store interface
   */
  interface KvStore {
    /**
     * Get string value from store
     * @param url URL identifier
     * @param domain Storage domain
     * @param key Key to retrieve
     * @returns String value or undefined if not found
     */
    getString(url: string, domain: KvStoreDomain, key: string): string | undefined;

    /**
     * Get integer value from store
     * @param url URL identifier
     * @param domain Storage domain
     * @param key Key to retrieve
     * @param defaultValue Default value if key not found
     * @returns Integer value
     */
    getInteger(url: string, domain: KvStoreDomain, key: string, defaultValue: number): number;

    /**
     * Get boolean value from store
     * @param url URL identifier
     * @param domain Storage domain
     * @param key Key to retrieve
     * @param defaultValue Default value if key not found
     * @returns Boolean value
     */
    getBoolean(url: string, domain: KvStoreDomain, key: string, defaultValue: boolean): boolean;

    /**
     * Set value in store
     * @param url URL identifier
     * @param domain Storage domain
     * @param key Key to set
     * @param value Value to store (string, number, boolean, or null to remove)
     */
    set(url: string, domain: KvStoreDomain, key: string, value: string | number | boolean | null): void;
  }

  const kvstore: KvStore;
  export = kvstore;
}
