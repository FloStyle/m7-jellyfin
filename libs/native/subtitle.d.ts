declare module 'native/subtitle' {
  /**
   * Subtitle provider interface
   */
  interface SubtitleProvider {
    /**
     * Add new subtitle provider
     * @param id Provider ID
     * @param title Provider title
     * @param callback Callback function for subtitle queries
     * @returns Subtitle provider object
     */
    addProvider(
      id: string,
      title: string,
      callback: (
        propRoot: object,
        query: {
          title?: string;
          imdb?: string;
          season?: number;
          year?: number;
          episode?: number;
          filesize?: number;
          duration?: number;
          opensubhash?: string;
          subdbhash?: string;
        },
        score: number,
        autosel: boolean
      ) => void
    ): object;
  }

  /**
   * Subtitle item interface
   */
  interface SubtitleItem {
    /**
     * Add subtitle item
     * @param propRoot Root property object
     * @param url Subtitle URL
     * @param title Subtitle title
     * @param score Subtitle score
     * @param autosel Whether to auto-select this subtitle
     * @param language Subtitle language
     * @param format Subtitle format
     * @param source Subtitle source
     */
    addItem(
      propRoot: object,
      url: string,
      title: string,
      score: number,
      autosel: boolean,
      language?: string,
      format?: string,
      source?: string
    ): void;
  }

  /**
   * Subtitle language interface
   */
  interface SubtitleLanguage {
    /**
     * Get available subtitle languages
     * @returns Array of language codes
     */
    getLanguages(): string[];
  }

  const subtitle: {
    /**
     * Subtitle provider operations
     */
    provider: SubtitleProvider;

    /**
     * Subtitle item operations
     */
    item: SubtitleItem;

    /**
     * Subtitle language operations
     */
    language: SubtitleLanguage;
  };

  export = subtitle;
}
