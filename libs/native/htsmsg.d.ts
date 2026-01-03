declare module 'native/htsmsg' {
  /**
   * HTS message field value type
   */
  type HtsMsgFieldValue = string | number | HtsMsg;

  /**
   * HTS message field interface
   */
  interface HtsMsgField {
    /**
     * Field name
     */
    name: string;

    /**
     * Field value
     */
    value: HtsMsgFieldValue;

    /**
     * Child message (if value is a nested message)
     */
    msg?: HtsMsg;
  }

  /**
   * HTS message interface
   */
  interface HtsMsg {
    /**
     * Create message from XML
     * @param xml XML string to parse
     * @returns Parsed message
     */
    createFromXML(xml: string): HtsMsg;

    /**
     * Get field value by name or index
     * @param key Field name or index
     * @returns Field value or undefined if not found
     */
    get(key: string | number): HtsMsgField | undefined;

    /**
     * Get field name by index
     * @param index Field index
     * @returns Field name or undefined if not found
     */
    getName(index: number): string | undefined;

    /**
     * Enumerate field names
     * @returns Array of field names
     */
    enumerate(): string[];

    /**
     * Get number of fields
     * @returns Field count
     */
    length(): number;

    /**
     * Print message to console
     */
    print(): void;
  }

  const htsmsg: HtsMsg;
  export = htsmsg;
}
