declare module 'movian/store' {
  /**
   * Store interface
   */
  interface Store {
    /**
     * Create store from path
     * @param path Path to store file
     */
    createFromPath(path: string): StoreInstance;

    /**
     * Create store with name
     * @param name Store name
     */
    create(name: string): StoreInstance;
  }

  /**
   * Store instance interface
   */
  interface StoreInstance {
    /**
     * Get value by key
     * @param key Key to get
     */
    [key: string]: any;

    /**
     * Check if key exists
     * @param key Key to check
     */
    has(key: string): boolean;
  }

  const store: Store;
  export = store;
}
