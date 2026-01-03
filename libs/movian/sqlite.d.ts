declare module 'movian/sqlite' {
  /**
   * SQLite database interface
   */
  interface SQLite {
    /**
     * Create new database instance
     * @param dbname Database name
     */
    create(dbname: string): SQLiteInstance;

    /**
     * Execute SQL query
     * @param db Database instance
     * @param query SQL query string
     * @param params Query parameters
     */
    query(db: SQLiteInstance, query: string, ...params: (string | number | boolean | null)[]): void;

    /**
     * Step through query results
     * @param db Database instance
     * @returns Result row as object or null if no more rows
     */
    step(db: SQLiteInstance): Record<string, string | number | boolean> | null;

    /**
     * Upgrade database schema
     * @param db Database instance
     * @param path Path to schema file
     */
    upgradeSchema(db: SQLiteInstance, path: string): void;

    /**
     * Get last inserted row ID
     * @param db Database instance
     */
    lastRowId(db: SQLiteInstance): number;

    /**
     * Get last error message
     * @param db Database instance
     */
    lastErrorString(db: SQLiteInstance): string;

    /**
     * Get last error code
     * @param db Database instance
     */
    lastErrorCode(db: SQLiteInstance): number;
  }

  /**
   * SQLite database instance
   */
  interface SQLiteInstance {
    // Internal database handle
  }

  const sqlite: SQLite;
  export = sqlite;
}
