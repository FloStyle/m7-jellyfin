declare module 'native/string' {
  /**
   * String manipulation interface
   */
  interface StringUtils {
    /**
     * Check if string is valid UTF-8
     * @param str String to check
     * @returns Whether string is valid UTF-8
     */
    isUtf8(str: string | ArrayBuffer): boolean;

    /**
     * Convert bytes to UTF-8 string
     * @param bytes Buffer containing bytes
     * @param encoding Optional encoding name
     * @returns UTF-8 string
     */
    utf8FromBytes(bytes: ArrayBuffer, encoding?: string): string;

    /**
     * Decode HTML entities in string
     * @param str String with HTML entities
     * @returns Decoded string
     */
    entityDecode(str: string): string;

    /**
     * Split query string into key-value pairs
     * @param query Query string
     * @returns Object with key-value pairs
     */
    queryStringSplit(query: string): Record<string, string>;

    /**
     * Escape string for use in URL path
     * @param str String to escape
     * @returns Escaped string
     */
    pathEscape(str: string): string;

    /**
     * Escape string for use in URL parameters
     * @param str String to escape
     * @returns Escaped string
     */
    paramEscape(str: string): string;

    /**
     * Convert duration in seconds to string (HH:MM:SS or MM:SS)
     * @param seconds Duration in seconds
     * @returns Formatted duration string
     */
    durationToString(seconds: number): string;

    /**
     * Parse time string to timestamp
     * @param timeStr Time string
     * @returns Timestamp in milliseconds
     */
    parseTime(timeStr: string): number;

    /**
     * Parse URL string into components
     * @param url URL string
     * @param parseQuery Whether to parse query string
     * @returns URL components object
     */
    parseURL(url: string, parseQuery: boolean): {
      protocol: string;
      hostname: string;
      auth?: string;
      port?: number;
      path: string;
      hash?: string;
      search?: string;
      query: Record<string, string>;
      pathname: string;
    };

    /**
     * Resolve relative URL against base URL
     * @param base Base URL
     * @param url Relative URL
     * @returns Resolved URL
     */
    resolveURL(base: string, url: string): string;
  }

  const string: StringUtils;
  export = string;
}
