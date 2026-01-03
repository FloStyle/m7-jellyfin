declare module 'native/timer' {
  /**
   * Timer interface
   */
  interface Timer {
    /**
     * Set a timeout
     * @param callback Callback function
     * @param delay Delay in milliseconds
     * @returns Timer object
     */
    setTimeout(callback: () => void, delay: number): object;

    /**
     * Set an interval
     * @param callback Callback function
     * @param interval Interval in milliseconds
     * @returns Timer object
     */
    setInterval(callback: () => void, interval: number): object;

    /**
     * Clear a timeout or interval
     * @param timer Timer object to clear
     */
    clearTimeout(timer: object): void;

    /**
     * Clear an interval
     * @param timer Timer object to clear
     */
    clearInterval(timer: object): void;
  }

  const timer: Timer;
  export = timer;
}
