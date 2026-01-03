declare module 'movian/html' {
  /**
   * HTML Node interface representing a node in the parsed HTML document.
   * Provides access to node properties and methods for traversing the DOM.
   */
  interface Node {
    /**
     * The name of the node (e.g., "DIV", "P", "SPAN").
     * For text nodes, this will be "#text".
     */
    readonly nodeName: string;

    /**
     * The type of the node (e.g., 1 for element nodes, 3 for text nodes).
     * Corresponds to standard DOM node types.
     */
    readonly nodeType: number;

    /**
     * An array of child nodes of this node.
     * Returns an empty array if the node has no children.
     */
    readonly children: Node[];

    /**
     * The text content of the node and its descendants.
     * Returns an empty string if the node has no text content.
     */
    readonly textContent: string;

    /**
     * A NamedNodeMap of attributes for this node.
     * Provides methods for accessing attributes by name.
     */
    readonly attributes: NamedNodeMap;

    /**
     * Finds and returns the first element with the specified ID.
     * @param id The ID of the element to find.
     * @returns The matching element node, or null if not found.
     */
    getElementById(id: string): Node | null;

    /**
     * Finds and returns all elements with the specified class name.
     * @param cls The class name to search for.
     * @returns An array of matching element nodes.
     */
    getElementByClassName(cls: string): Node[];

    /**
     * Finds and returns all elements with the specified tag name.
     * @param tag The tag name to search for (e.g., "div", "p").
     * @returns An array of matching element nodes.
     */
    getElementByTagName(tag: string): Node[];
  }

  /**
   * Represents a parsed HTML document, containing the document and root nodes.
   */
  interface ParsedHTML {
    /**
     * The document node, representing the entire HTML document.
     * Use this to access the full document structure.
     */
    document: Node;

    /**
     * The root node of the HTML document, typically the <html> element.
     * Use this to access the root of the document tree.
     */
    root: Node;
  }

  /**
   * Parses an HTML string and returns a ParsedHTML object.
   * @param html The HTML string to parse.
   * @returns A ParsedHTML object containing the document and root nodes.
   */
  function parse(html: string): ParsedHTML;

  export = parse;
}
