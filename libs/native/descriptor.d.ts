declare module 'native/descriptor' {
  /**
   * Duktape context type
   */
  type DuktapeContext = any;

  /**
   * Duktape thread state type
   */
  type DukThreadState = any;

  /**
   * ECMAScript context handle
   */
  interface ESContext {
    /**
     * Get the Duktape context
     */
    getContext(): DuktapeContext;

    /**
     * Begin execution in this context
     */
    begin(): DuktapeContext;

    /**
     * Suspend execution
     */
    suspend(state: DukThreadState): void;

    /**
     * Resume execution
     */
    resume(state: DukThreadState): void;

    /**
     * End execution
     */
    end(doGC: boolean): void;
  }

  /**
   * ECMAScript resource
   */
  interface ESResource {
    /**
     * Release the resource
     */
    release(): void;

    /**
     * Destroy the resource
     */
    destroy(): void;

    /**
     * Unlink the resource
     */
    unlink(): void;
  }

  /**
   * Console functionality
   */
  interface Console {
    /**
     * Log message to console
     * @param args Messages to log
     */
    log(...args: any[]): void;

    /**
     * Log error message to console
     * @param args Error messages to log
     */
    error(...args: any[]): void;

    /**
     * Log warning message to console
     * @param args Warning messages to log
     */
    warn(...args: any[]): void;
  }

  /**
   * Core ECMAScript functionality
   */
  interface Core {
    /**
     * Compile ECMAScript code
     * @param path Path to script file
     */
    compile(path: string): Function;

    /**
     * Sleep for specified seconds
     * @param seconds Number of seconds to sleep
     */
    sleep(seconds: number): void;

    /**
     * Get current timestamp
     */
    timestamp(): number;

    /**
     * Generate random bytes
     * @param length Number of bytes to generate
     */
    randomBytes(length: number): Uint8Array;

    /**
     * Create a new ECMAScript context
     * @param id Context identifier
     * @param flags Context flags
     * @param url Script URL
     * @param storage Storage path
     */
    createContext(id: string, flags: number, url: string, storage: string): ESContext;

    /**
     * Load an ECMAScript plugin
     * @param id Plugin ID
     * @param url Plugin URL
     * @param manifest Plugin manifest
     * @param version API version
     * @param flags Plugin flags
     */
    loadPlugin(id: string, url: string, manifest: string, version: number, flags: number): void;

    /**
     * Unload an ECMAScript plugin
     * @param id Plugin ID
     */
    unloadPlugin(id: string): void;

    /**
     * Console instance
     */
    console: Console;
  }

  const Core: Core;
  export = Core;
}
