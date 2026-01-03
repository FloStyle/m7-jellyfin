declare module 'native/gumbo' {
  /**
   * Gumbo node types
   */
  type NodeType = 
    | 'document'   // 9
    | 'element'    // 1
    | 'text'       // 3
    | 'comment';   // 8

  /**
   * HTML node interface
   */
  interface Node {
    /**
     * Get node type
     */
    type(): NodeType;

    /**
     * Get node name
     */
    name(): string;

    /**
     * Get child nodes
     * @param all Whether to include all node types (default: false)
     */
    children(all?: boolean): Node[];

    /**
     * Get node attributes
     */
    attributes(): { name: string, value: string }[];

    /**
     * Get text content of node and its descendants
     */
    textContent(): string;

    /**
     * Find element by ID
     * @param id Element ID to find
     */
    findById(id: string): Node | null;

    /**
     * Find elements by tag name
     * @param tagName Tag name to find
     */
    findByTagName(tagName: string): Node[];

    /**
     * Find elements by class name
     * @param className Class name to find
     */
    findByClassName(className: string): Node[];
  }

  /**
   * Gumbo parser interface
   */
  interface Gumbo {
    /**
     * Parse HTML string
     * @param html HTML string to parse
     * @returns Parsed document object
     */
    parse(html: string): {
      document: Node;
      root: Node;
    };
  }

  const gumbo: Gumbo;
  export = gumbo;
}
