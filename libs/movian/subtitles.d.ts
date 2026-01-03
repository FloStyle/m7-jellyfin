declare module 'movian/subtitles' {
  /**
   * Subtitle provider interface
   */
  interface SubtitleProvider {
    /**
     * Add subtitle provider
     * @param provider Provider function
     * @param pluginId Plugin ID
     */
    addProvider(provider: (root: any, query: SubtitleQuery, basescore: number, autosel: boolean) => void, pluginId: string): void;

    /**
     * Get available languages
     */
    getLanguages(): string[];
  }

  /**
   * Subtitle query interface
   */
  interface SubtitleQuery {
    /**
     * Add subtitle
     * @param url Subtitle URL
     * @param title Subtitle title
     * @param language Subtitle language
     * @param format Subtitle format
     * @param source Subtitle source
     * @param score Subtitle score
     */
    addSubtitle(url: string, title: string, language: string, format: string, source: string, score: number): void;
  }

  const subtitles: SubtitleProvider;
  export = subtitles;
}
