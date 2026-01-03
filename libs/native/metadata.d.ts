declare module 'native/metadata' {
  /**
   * Video metadata interface
   */
  interface VideoMetadata {
    /**
     * Bind video metadata
     * @param root Root property object
     * @param url Video URL
     * @param options Metadata options
     */
    bind(root: object, url: string, options: {
      filename?: string;
      title?: string;
      year?: number;
      season?: number;
      episode?: number;
      imdb?: string;
      duration?: number;
    }): void;
  }

  /**
   * Play info interface
   */
  interface PlayInfo {
    /**
     * Bind play info to property
     * @param prop Property object
     * @param url Play URL
     */
    bind(prop: object, url: string): void;
  }

  const metadata: {
    /**
     * Video metadata operations
     */
    video: VideoMetadata;

    /**
     * Play info operations
     */
    play: PlayInfo;
  };

  export = metadata;
}
