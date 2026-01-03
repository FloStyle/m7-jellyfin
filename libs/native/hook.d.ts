declare module 'native/hook' {
  /**
   * Hook callback function type
   */
  type HookCallback = (...args: any[]) => void;

  /**
   * Hook interface
   */
  interface Hook {
    /**
     * Register a new hook
     * @param type Hook type/name
     * @param callback Callback function to invoke
     */
    register(type: string, callback: HookCallback): void;
  }

  const hook: Hook;
  export = hook;
}
