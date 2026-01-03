declare module 'native/root' {
  /**
   * Root management interface
   */
  interface Root {
    /**
     * Register root object
     * @param obj Object to register
     * @param ptr Pointer to associate with object
     */
    register(obj: object, ptr: unknown): void;

    /**
     * Unregister root object
     * @param ptr Pointer associated with object
     */
    unregister(ptr: unknown): void;

    /**
     * Push root object to stack
     * @param ptr Pointer associated with object
     * @returns Registered object
     */
    push(ptr: unknown): object;
  }

  const root: Root;
  export = root;
}
