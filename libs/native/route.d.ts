declare module 'native/route' {
  /**
   * Route interface
   */
  interface Route {
    /**
     * Create new route
     * @param pattern Route pattern (regex)
     * @returns Route object
     */
    create(pattern: string): Route;

    /**
     * Test if URL matches any route
     * @param url URL to test
     * @returns Whether URL matches a route
     */
    test(url: string): boolean;

    /**
     * Open URL through backend
     * @param page Page property
     * @param url URL to open
     * @param sync Whether to open synchronously
     */
    backendOpen(page: object, url: string, sync: boolean): void;
  }

  const route: Route;
  export = route;
}
