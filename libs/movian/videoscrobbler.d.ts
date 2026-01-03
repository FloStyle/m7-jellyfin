declare module 'movian/videoscrobbler' {
  /**
   * VideoScrobbler interface
   */
  interface VideoScrobbler {
    /**
     * Create new VideoScrobbler instance
     */
    new(): VideoScrobblerInstance;
  }

  /**
   * VideoScrobbler instance interface
   */
  interface VideoScrobblerInstance {
    /**
     * Destroy the scrobbler instance
     */
    destroy(): void;

    /**
     * Callback for video start event
     */
    onstart?: (data: any, prop: any, origin: any) => void;

    /**
     * Callback for video pause event
     */
    onpause?: (data: any, prop: any, origin: any) => void;

    /**
     * Callback for video resume event
     */
    onresume?: (data: any, prop: any, origin: any) => void;

    /**
     * Callback for video stop event
     */
    onstop?: (data: any, prop: any, origin: any) => void;
  }

  const VideoScrobbler: VideoScrobbler;
  export = VideoScrobbler;
}
