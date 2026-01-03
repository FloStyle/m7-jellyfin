declare module 'native/fs' {
  /**
   * File descriptor interface
   */
  interface FileDescriptor {
    /**
     * Read data from the file
     * @param buffer Buffer to store read data
     * @param offset Offset in buffer to start writing
     * @param length Number of bytes to read
     * @param position File position to read from (null for current position)
     * @returns Number of bytes read
     */
    read(buffer: ArrayBuffer, offset: number, length: number, position: number | null): number;

    /**
     * Write data to the file
     * @param buffer Data to write
     * @param offset Offset in buffer to start reading
     * @param length Number of bytes to write (null for entire buffer)
     * @param position File position to write at (null for current position)
     * @returns Number of bytes written
     */
    write(buffer: ArrayBuffer, offset: number, length: number | null, position: number | null): number;

    /**
     * Get file size
     * @returns File size in bytes
     */
    size(): number;

    /**
     * Truncate file to specified length
     * @param length New file length
     */
    truncate(length: number): void;
  }

  /**
   * File system operations
   */
  interface FileSystem {
    /**
     * Open a file
     * @param path File path
     * @param mode Open mode ('r', 'w', or 'a')
     * @returns File descriptor
     */
    open(path: string, mode: 'r' | 'w' | 'a'): FileDescriptor;

    /**
     * Rename a file or directory
     * @param oldPath Old path
     * @param newPath New path
     */
    rename(oldPath: string, newPath: string): void;

    /**
     * Create directories recursively
     * @param path Directory path to create
     */
    mkdirs(path: string): void;

    /**
     * Get directory name from path
     * @param path Full path
     * @returns Directory name
     */
    dirname(path: string): string;

    /**
     * Get base name from path
     * @param path Full path
     * @returns Base name
     */
    basename(path: string): string;

    /**
     * Copy a file
     * @param src Source file path
     * @param dest Destination file path
     * @returns Destination path
     */
    copy(src: string, dest: string): string;
  }

  const fs: FileSystem;
  export = fs;
}
