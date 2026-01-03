declare module 'native/videoscrobble' {
  /**
   * Video scrobble event type
   */
  type VideoScrobbleEvent = 'start' | 'stop';

  /**
   * Video scrobble data
   */
  interface VideoScrobbleData {
    [key: string]: string | number | boolean;
  }

  /**
   * Video scrobble interface
   */
  interface VideoScrobble {
    /**
     * Handle video scrobble event
     * @param event Event type
     * @param data Scrobble data
     * @param prop Video property
     * @param origin Origin property
     */
    handle(
      event: VideoScrobbleEvent,
      data: VideoScrobbleData,
      prop: object,
      origin: object
    ): void;
  }

  const videoscrobble: VideoScrobble;
  export = videoscrobble;
}
