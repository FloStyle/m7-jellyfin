declare module 'native/search' {
  /**
   * Search interface
   */
  interface Search {
    /**
     * Perform search
     * @param model Search model property
     * @param query Search query
     * @param loading Loading state property
     */
    perform(model: object, query: string, loading: object): void;
  }

  const search: Search;
  export = search;
}
