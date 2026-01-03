declare module 'native/stats' {
  /**
   * ECMAScript statistics interface
   */
  interface Stats {
    /**
     * Get ECMAScript context statistics
     * @returns Statistics as text
     */
    getStats(): string;

    /**
     * Trigger garbage collection
     */
    gc(): void;
  }

  const stats: Stats;
  export = stats;
}
