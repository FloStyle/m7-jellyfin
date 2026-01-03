declare module 'native/misc' {
  /**
   * Cache interface
   */
  interface Cache {
    /**
     * Store data in cache
     * @param stash Cache namespace
     * @param key Cache key
     * @param data Data to store
     * @param maxAge Maximum age in seconds
     */
    put(stash: string, key: string, data: ArrayBuffer, maxAge: number): void;

    /**
     * Retrieve data from cache
     * @param stash Cache namespace
     * @param key Cache key
     * @returns Cached data or null if not found
     */
    get(stash: string, key: string): ArrayBuffer | null;
  }

  /**
   * System information interface
   */
  interface System {
    /**
     * Get system IP address
     * @returns IP address as string
     */
    ipAddress(): string;
  }

  const misc: {
    /**
     * Cache operations
     */
    cache: Cache;

    /**
     * System information
     */
    system: System;
  };

  export = misc;
}
