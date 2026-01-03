declare module 'movian/popup' {
  /**
   * Show a notification
   * @param text Notification text
   * @param delay Display duration in milliseconds
   * @param icon Optional icon name
   */
  export function notify(text: string, delay: number, icon?: string): void;
}
