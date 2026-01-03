declare module 'movian/xml' {
  /**
   * XML Node interface
   */
  interface XMLNode {
    /**
     * Get field value by key
     * @param key Field key
     */
    [key: string]: any;

    /**
     * Convert node to string
     */
    toString(): string;

    /**
     * Get raw node value
     */
    valueOf(): any;

    /**
     * Print node structure
     */
    dump(): void;

    /**
     * Filter child nodes by name
     * @param filter Node name filter
     */
    filterNodes(filter: string): XMLNode[];

    /**
     * Number of child nodes
     */
    length: number;
  }

  /**
   * XML interface
   */
  interface XML {
    /**
     * Parse XML string
     * @param str XML string to parse
     */
    parse(str: string): XMLNode;

    /**
     * Create XML node from htsmsg
     * @param x htsmsg object
     */
    htsmsg(x: any): XMLNode;
  }

  const xml: XML;
  export = xml;
}
