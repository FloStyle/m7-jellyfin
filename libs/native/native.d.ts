declare module 'native/native' {
  /**
   * Native object interface
   */
  interface NativeObject {
    /**
     * Get native object from context
     * @param ctx Context object
     * @param objIdx Object index
     * @param wantedType Expected native type
     * @returns Native object pointer
     */
    get(ctx: object, objIdx: number, wantedType: string): unknown;

    /**
     * Get native object from context without throwing
     * @param ctx Context object
     * @param objIdx Object index
     * @param wantedType Expected native type
     * @returns Native object pointer or null
     */
    getNoThrow(ctx: object, objIdx: number, wantedType: string): unknown | null;

    /**
     * Push native object to context
     * @param ctx Context object
     * @param className Native class name
     * @param ptr Native object pointer
     * @returns Object index
     */
    push(ctx: object, className: string, ptr: unknown): number;

    /**
     * Get native class name by ID
     * @param id Class ID
     * @returns Class name or null
     */
    className(id: number): string | null;
  }

  const native: NativeObject;
  export = native;
}
