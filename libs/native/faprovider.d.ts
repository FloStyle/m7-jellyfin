declare module 'native/faprovider' {
  /**
   * File access handle
   */
  interface FileHandle {
    /**
     * Read data from the file
     * @param buffer Buffer to store read data
     * @param size Number of bytes to read
     * @returns Number of bytes read or -1 on error
     */
    read(buffer: ArrayBuffer, size: number): number;

    /**
     * Close the file handle
     */
    close(): void;

    /**
     * Get file size
     * @returns File size in bytes
     */
    getSize(): number;

    /**
     * Seek to a position in the file
     * @param offset Offset to seek to
     * @param whence Seek mode (SEEK_SET, SEEK_CUR, SEEK_END)
     * @returns New position or -1 on error
     */
    seek(offset: number, whence: number): number;
  }

  /**
   * File access provider interface
   */
  interface FileAccessProvider {
    /**
     * Open a file
     * @param url URL of the file to open
     * @param flags Open flags
     * @returns File handle or null on error
     */
    open(url: string, flags: number): FileHandle | null;

    /**
     * Get file status
     * @param url URL of the file
     * @param flags Stat flags
     * @returns File status object or null on error
     */
    stat(url: string, flags: number): FileStatus | null;

    /**
     * Get redirect URL
     * @param url Original URL
     * @returns Redirect URL or null if no redirect
     */
    redirect(url: string): string | null;
  }

  /**
   * File status information
   */
  interface FileStatus {
    /**
     * File size in bytes
     */
    size: number;

    /**
     * File type (file or directory)
     */
    type: 'file' | 'directory';

    /**
     * Last modification time
     */
    mtime: number;
  }

  /**
   * Register a new file access provider
   * @param name Provider name
   * @param options Provider options
   */
  function registerProvider(name: string, options: ProviderOptions): void;

  /**
   * Provider options
   */
  interface ProviderOptions {
    /**
     * Whether the provider supports caching
     */
    cacheable?: boolean;

    /**
     * Whether the provider supports redirects
     */
    redirect?: boolean;
  }

  const faprovider: {
    register: typeof registerProvider;
  };

  export = faprovider;
}
