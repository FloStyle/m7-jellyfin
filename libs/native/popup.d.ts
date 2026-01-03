declare module 'native/popup' {
  /**
   * Web popup result
   */
  interface WebPopupResult {
    /**
     * Result type
     */
    result: 'trapped' | 'userclose' | 'neterror' | 'error' | 'unsupported';

    /**
     * Trapped URL (if result is 'trapped')
     */
    trappedUrl?: string;

    /**
     * Query arguments (if result is 'trapped')
     */
    args: Record<string, string>;
  }

  /**
   * Authentication credentials
   */
  interface AuthCredentials {
    /**
     * Whether user rejected the prompt
     */
    rejected?: boolean;

    /**
     * Username
     */
    username?: string;

    /**
     * Password
     */
    password?: string;
  }

  /**
   * Text dialog result
   */
  interface TextDialogResult {
    /**
     * Whether user rejected the prompt
     */
    rejected?: boolean;

    /**
     * User input
     */
    input?: string;
  }

  /**
   * Popup interface
   */
  interface Popup {
    /**
     * Open a web popup
     * @param url URL to open
     * @param title Popup title
     * @param trap URL pattern to trap
     * @returns Web popup result
     */
    webpopup(url: string, title: string, trap: string): WebPopupResult;

    /**
     * Get authentication credentials
     * @param source Authentication source
     * @param reason Reason for authentication
     * @param query Whether to query user
     * @param id Optional identifier
     * @param forceTemporary Whether to force temporary storage
     * @returns Authentication credentials
     */
    getAuthCredentials(
      source: string,
      reason: string,
      query: boolean,
      id?: string,
      forceTemporary?: boolean
    ): AuthCredentials;

    /**
     * Show a message popup
     * @param message Message to display
     * @param ok Show OK button
     * @param cancel Show Cancel button
     * @returns true if OK clicked, false if Cancel clicked
     */
    message(message: string, ok: boolean, cancel: boolean): boolean;

    /**
     * Show a text input dialog
     * @param message Prompt message
     * @param ok Show OK button
     * @param cancel Show Cancel button
     * @returns Text dialog result
     */
    textDialog(message: string, ok: boolean, cancel: boolean): TextDialogResult;

    /**
     * Show a notification
     * @param text Notification text
     * @param delay Display duration in milliseconds
     * @param icon Optional icon name
     */
    notify(text: string, delay: number, icon?: string): void;
  }

  const popup: Popup;
  export = popup;
}
